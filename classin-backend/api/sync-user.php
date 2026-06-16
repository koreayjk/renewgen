<?php
/* ──────────────────────────────────────────────────────────────────
 *  sync-user.php — 회원가입 ↔ 클래스인 계정 "동일인" 연결 (이메일 메인)
 *  ────────────────────────────────────────────────────────────────
 *  리뉴젠 홈페이지 회원가입(또는 최초 로그인) 시 1번 호출합니다.
 *  학생의 "가입 이메일"을 클래스인에 대신 등록(register)하면
 *  클래스인이 그 이메일의 고유 UID 를 돌려줍니다.
 *  이 UID 가 곧 "이 회원 = 이 클래스인 학생" 을 잇는 열쇠입니다.
 *
 *  ✔ 같은 이메일 = 같은 클래스인 계정 = 같은 UID  → 동일인 보장
 *  ✔ 이미 가입된 이메일이면 클래스인이 errno=461 과 함께 기존 UID 를 줌 → 그걸 저장
 *  ✔ (휴대폰을 함께 넘기면 errno=135 처리도 동일)
 *  ✔ 그 뒤 OMR 성적 푸시(StudentAccount=이메일)가 이 매핑으로 회원에 붙음
 *
 *  요청(POST JSON 또는 form):
 *    email     (필수)  가입 이메일 — 클래스인 로그인 계정이 됨 (메인 키)
 *    memberId  (필수)  우리 홈페이지 회원 ID (Supabase user id 등)
 *    name      (선택)  학생 이름 (닉네임/표시명)
 *    telephone (선택)  휴대폰이 있으면 함께 저장 (보조 매칭 키)
 *    password  (선택)  미지정 시 임시 비밀번호 자동 생성
 *    role      (선택)  'student'(기본) | 'teacher'
 *
 *  ⚠️ 대리 등록은 본인 동의가 전제입니다(회원가입 약관에 포함).
 *  ⚠️ 운영에서는 로그인 세션의 본인 == memberId 인지 먼저 검증하세요.
 * ──────────────────────────────────────────────────────────────── */

require __DIR__ . '/_bootstrap.php';

$in        = input();
$email     = trim((string)($in['email'] ?? ''));
$memberId  = trim((string)($in['memberId'] ?? ''));
$name      = trim((string)($in['name'] ?? ''));
$telephone = trim((string)($in['telephone'] ?? ''));   // 선택
$role      = ($in['role'] ?? 'student') === 'teacher' ? 'teacher' : 'student';
$password  = (string)($in['password'] ?? '');

if ($email === '' || $memberId === '') {
    fail('email, memberId 가 필요합니다.');
}
// 임시 비밀번호 (학생은 보통 원클릭 입장만 쓰므로 직접 입력할 일이 없음)
if ($password === '') {
    $password = substr(md5($email . microtime() . random_int(0, 1e9)), 0, 12);
}

try {
    $ci = new ClassIn($CONFIG);

    // 1) 클래스인에 계정 등록(대리). 이메일이 메인, 휴대폰은 있으면 함께.
    //    · md5pass = 32자리 MD5 (password 평문 대신 권장)
    //    · addToSchoolMember=1 → 기관 학생 목록에도 표시 (2=교사)
    $params = [
        'email'             => $email,
        'md5pass'           => md5($password),
        'addToSchoolMember' => $role === 'teacher' ? 2 : 1,
    ];
    if ($name !== '')      $params['nickname']  = $name;
    if ($telephone !== '') $params['telephone'] = $telephone;

    $resp  = $ci->call('register', $params);
    $errno = (int)($resp['error_info']['errno'] ?? 0);
    $uid   = (string)($resp['data'] ?? '');

    // errno=1 신규 / 461 이메일 이미가입 / 135 휴대폰 이미가입 → 모두 data 에 UID 포함
    if ($uid === '' && !in_array($errno, [1, 461, 135], true)) {
        logline('SYNCUSER_FAIL', $resp);
        fail("클래스인 계정 등록 실패 (errno=$errno)", 502);
    }

    // 2) 우리 DB 에 매핑 저장 (UPSERT) — 이후 성적 푸시가 여기로 붙음
    $pdo = db($CONFIG);
    $st = $pdo->prepare(
        "INSERT INTO classin_users (uid, member_id, name, email, telephone, role, created_at)
         VALUES (:uid, :member, :name, :email, :tel, :role, NOW())
         ON DUPLICATE KEY UPDATE
           member_id = VALUES(member_id),
           name      = VALUES(name),
           email     = VALUES(email),
           telephone = VALUES(telephone),
           role      = VALUES(role)"
    );
    $st->execute([
        ':uid'    => $uid,
        ':member' => $memberId,
        ':name'   => $name,
        ':email'  => $email,
        ':tel'    => $telephone !== '' ? $telephone : null,
        ':role'   => $role,
    ]);

    // 3) 가입 전에 들어와 있던 성적에 member_id 를 소급 연결
    //    (uid · 이메일 · 휴대폰 어느 것으로든 매칭)
    try {
        $back = $pdo->prepare(
            "UPDATE classin_scores SET member_id = :member
             WHERE member_id IS NULL
               AND (student_uid = :uid
                    OR student_account = :email
                    OR (:tel <> '' AND student_account = :tel))"
        );
        $back->execute([':member' => $memberId, ':uid' => $uid, ':email' => $email, ':tel' => $telephone]);
    } catch (Throwable $e) { /* 소급 실패는 치명적이지 않음 */ }

    reply([
        'ok'      => true,
        'uid'     => $uid,
        'existed' => in_array($errno, [461, 135], true), // 이미 있던 계정에 연결됨
        'matchedBy' => $errno === 461 ? 'email' : ($errno === 135 ? 'telephone' : 'new'),
        'role'    => $role,
    ]);

} catch (Throwable $e) {
    logline('SYNCUSER_EX', $e->getMessage());
    fail('서버 오류: ' . $e->getMessage(), 500);
}

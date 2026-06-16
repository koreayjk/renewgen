<?php
/* ──────────────────────────────────────────────────────────────────
 *  enter.php — 원클릭 강의실 입장 URL 발급 (Login URL)
 *  ────────────────────────────────────────────────────────────────
 *  클래스인: action=getLoginLinked
 *  필요값: uid(학생 UID), courseId, classId, deviceType(1=PC,2=iOS,3=AOS)
 *  반환:   classin://...enterclass?...  형태의 "클라이언트 실행 링크"
 *
 *  프론트엔드 "원클릭 입장" 버튼이 이 파일을 호출 →
 *  받은 url 로 location.href 이동하면 클래스인 앱이 실행됩니다.
 *
 *  ⚠️ uid/courseId/classId 는 실제로는 "로그인된 사용자"와
 *     "수강 신청한 강의"인지 서버에서 반드시 검증해야 합니다.
 *     (아래 TODO 참고 — 임의의 사람이 남의 강의실에 들어가면 안 됨)
 * ──────────────────────────────────────────────────────────────── */

require __DIR__ . '/_bootstrap.php';

$in = input();
$uid      = trim((string)($in['uid'] ?? ''));
$courseId = trim((string)($in['courseId'] ?? ''));
$classId  = trim((string)($in['classId'] ?? ''));
$device   = (int)($in['deviceType'] ?? 1); // 1=Win/Mac, 2=iOS, 3=Android

if ($uid === '' || $courseId === '' || $classId === '') {
    fail('uid, courseId, classId 가 필요합니다.');
}

// ── TODO(보안): 세션의 로그인 사용자 == $uid 인지,
//    그리고 그 사용자가 $courseId 를 수강 중인지 DB로 확인하세요.
//    예)  if ($_SESSION['classin_uid'] !== $uid) fail('권한 없음', 403);
//    예)  if (!isEnrolled(db($CONFIG), $uid, $courseId)) fail('미수강', 403);

try {
    $ci = new ClassIn($CONFIG);
    $resp = $ci->call('getLoginLinked', [
        'uid'        => $uid,
        'courseId'   => $courseId,
        'classId'    => $classId,
        'deviceType' => $device,
        'lifeTime'   => 600, // 링크 유효시간(초) — 짧게 두는 게 안전
    ]);

    if (!ClassIn::ok($resp)) {
        logline('ENTER_FAIL', $resp);
        $errno = $resp['error_info']['errno'] ?? '?';
        // 자주 나오는 에러: 145=수업종료, 150=해당 학원 소속 아님, 142=클래스없음
        fail("입장 링크 발급 실패 (errno=$errno)", 502);
    }

    $launchUrl = $resp['data']; // classin://... 또는 https://www.eeo.cn/client/...

    // PC/모바일 공용 "중간 안내 페이지"로 감싸면 클라이언트 미설치 시 안내됨.
    // (원하면 사용 — 클래스인이 제공하는 invoke 페이지)
    $params = parse_url($launchUrl, PHP_URL_QUERY);
    $invokeUrl = 'https://www.eeo.cn/client/invoke/index.html?' . $params;

    reply([
        'ok'        => true,
        'launchUrl' => $launchUrl,  // 바로 앱 실행 (deviceType 에 맞는 링크)
        'invokeUrl' => $invokeUrl,  // 미설치 안내까지 포함한 안전한 링크
    ]);

} catch (Throwable $e) {
    logline('ENTER_EX', $e->getMessage());
    fail('서버 오류: ' . $e->getMessage(), 500);
}

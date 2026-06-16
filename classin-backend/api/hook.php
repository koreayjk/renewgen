<?php
/* ──────────────────────────────────────────────────────────────────
 *  hook.php — 클래스인 데이터 수신 엔드포인트 (Data Subscription)
 *  ────────────────────────────────────────────────────────────────
 *  클래스인 관리콘솔/본사에 "데이터 수신 주소"로 이 파일의 URL을 등록합니다.
 *     예) https://renewgen.com/classin/api/hook.php
 *
 *  · 수업 진행 중: 실시간 데이터(입장/손들기/트로피/정답/네트워크 등)
 *  · 수업 종료 시: 요약 데이터(출석/평가/녹화파일 등)
 *  를 클래스인이 이 주소로 POST 합니다. 우리는 받아서 DB에 적재만 하면
 *  프론트 대시보드가 그 데이터를 읽어 보여줍니다.
 *
 *  ⚠️ 수신은 "한 시스템으로만" 가능하고, 과거 데이터 소급은 미지원입니다.
 *      반드시 빠르게 200 OK 를 돌려주세요(무거운 처리는 뒤로 미룸).
 * ──────────────────────────────────────────────────────────────── */

require __DIR__ . '/_bootstrap.php';

/**
 * 성적 푸시(AnswerSheetScore·ExamScore·HomeworkScore) 1건을 classin_scores 에 UPSERT.
 * 같은 시험을 재제출/재채점하면 같은 (activity_id, uid, cmd) 로 다시 와서 최신값으로 덮어씀.
 */
function saveScore(PDO $pdo, string $cmd, array $msg): void
{
    $d = $msg['Data'] ?? [];
    $stu = $d['StudentInfo'] ?? [];
    $activityId = (string)($d['ActivityId'] ?? '');
    $uid        = (string)($stu['StudentUid'] ?? '');
    if ($activityId === '' || $uid === '') return; // 식별 불가 → 건너뜀(원본은 events 에 이미 보관)

    // 만점: AnswerSheetScore 는 MaximumScore, ExamScore/HomeworkScore 는 Score
    $max  = $d['MaximumScore'] ?? $d['Score'] ?? null;
    $rate = isset($d['StudentScoringRate']) ? (float)$d['StudentScoringRate'] : null;

    // 취득 점수: 문항별 TopicScore 합계가 가장 정확. 없으면 득점률×만점.
    $score = null;
    if (!empty($d['TopicDetails']) && is_array($d['TopicDetails'])) {
        $sum = 0.0; $any = false;
        foreach ($d['TopicDetails'] as $t) {
            if (isset($t['TopicScore'])) { $sum += (float)$t['TopicScore']; $any = true; }
        }
        if ($any) $score = $sum;
    }
    // HomeworkScore 는 StudentScore(문자열) 로 점수를 주기도 함
    if ($score === null && isset($d['StudentScore']) && is_numeric($d['StudentScore'])) {
        $score = (float)$d['StudentScore'];
    }
    if ($score === null && $rate !== null && $max !== null) {
        $score = round($rate * (float)$max, 2);
    }

    $account = (string)($stu['StudentAccount'] ?? '');

    // 회원 매칭: classin_users 에서 uid → member_id, 없으면 계정(이메일/휴대폰)으로 시도
    //   ClassIn 은 StudentAccount 를 "휴대폰 있으면 휴대폰, 없으면 이메일"로 보냄
    $memberId = null;
    try {
        $q = $pdo->prepare("SELECT member_id FROM classin_users WHERE uid = ? LIMIT 1");
        $q->execute([$uid]);
        $memberId = $q->fetchColumn() ?: null;
        if (!$memberId && $account !== '') {
            $q2 = $pdo->prepare("SELECT member_id FROM classin_users WHERE email = ? OR telephone = ? LIMIT 1");
            $q2->execute([$account, $account]);
            $memberId = $q2->fetchColumn() ?: null;
        }
    } catch (Throwable $e) { /* 매핑 실패해도 성적은 저장 */ }

    $tsToDt = fn($t) => (!empty($t) && is_numeric($t)) ? date('Y-m-d H:i:s', (int)$t) : null;

    $sql = "INSERT INTO classin_scores
        (cmd, sid, course_id, course_name, unit_id, unit_name, activity_id, activity_name,
         class_id, student_uid, student_name, student_account, member_id,
         max_score, score, scoring_rate, topic_json, submitted_at, corrected_at, received_at)
        VALUES (:cmd,:sid,:course_id,:course_name,:unit_id,:unit_name,:activity_id,:activity_name,
         :class_id,:uid,:sname,:account,:member_id,
         :max,:score,:rate,:topic,:submitted,:corrected,NOW())
        ON DUPLICATE KEY UPDATE
         course_name=VALUES(course_name), unit_name=VALUES(unit_name),
         activity_name=VALUES(activity_name), class_id=VALUES(class_id),
         student_name=VALUES(student_name), student_account=VALUES(student_account),
         member_id=COALESCE(VALUES(member_id), member_id),
         max_score=VALUES(max_score), score=VALUES(score), scoring_rate=VALUES(scoring_rate),
         topic_json=VALUES(topic_json), submitted_at=VALUES(submitted_at),
         corrected_at=VALUES(corrected_at), received_at=NOW()";
    $st = $pdo->prepare($sql);
    $st->execute([
        ':cmd'          => $cmd,
        ':sid'          => (string)($msg['SID'] ?? ''),
        ':course_id'    => (string)($msg['CourseID'] ?? ''),
        ':course_name'  => (string)($msg['CourseName'] ?? ''),
        ':unit_id'      => (string)($d['UnitId'] ?? ''),
        ':unit_name'    => (string)($d['UnitName'] ?? ''),
        ':activity_id'  => $activityId,
        ':activity_name'=> (string)($d['ActivityName'] ?? ''),
        ':class_id'     => (string)($d['ClassId'] ?? ''),
        ':uid'          => $uid,
        ':sname'        => (string)($stu['StudentName'] ?? ''),
        ':account'      => $account,
        ':member_id'    => $memberId,
        ':max'          => $max !== null ? (float)$max : null,
        ':score'        => $score,
        ':rate'         => $rate,
        ':topic'        => isset($d['TopicDetails']) ? json_encode($d['TopicDetails'], JSON_UNESCAPED_UNICODE) : null,
        ':submitted'    => $tsToDt($d['SubmissionTime'] ?? null),
        ':corrected'    => $tsToDt($d['CorrectionTime'] ?? null),
    ]);
}

// 1) 원본 수신 (form 또는 JSON 모두 대응)
$raw = file_get_contents('php://input');
$data = input();

// 2) (선택) 토큰 검증 — 약속한 비밀 토큰이 있으면 대조
$token = $CONFIG['HOOK_TOKEN'] ?? '';
if ($token !== '') {
    $got = $_GET['token'] ?? ($_SERVER['HTTP_X_HOOK_TOKEN'] ?? '');
    if (!hash_equals($token, (string)$got)) {
        logline('HOOK_DENY', substr($raw, 0, 200));
        fail('unauthorized', 401);
    }
}

// 3) 항상 원본을 로그로 남긴다 (디버깅/감사용)
logline('HOOK', $raw !== '' ? $raw : $data);

// 4) DB 적재 — 메시지 유형(보통 'cmd' 또는 'action' 필드)으로 분기
try {
    $pdo = db($CONFIG);

    // 메시지 유형 — ClassIn 은 'Cmd'(대문자), 일부 구버전은 'cmd'/'action'
    $cmd = (string)($data['Cmd'] ?? $data['cmd'] ?? $data['action'] ?? 'unknown');

    // 원본 이벤트는 통째로 보관 (스키마 변화에 안전)
    $st = $pdo->prepare(
        "INSERT INTO classin_events (cmd, school_id, course_id, class_id, payload, received_at)
         VALUES (:cmd, :school, :course, :class, :payload, NOW())"
    );
    $st->execute([
        ':cmd'    => $cmd,
        ':school' => (string)($data['SID'] ?? $data['schoolId'] ?? $CONFIG['SID']),
        ':course' => (string)($data['CourseID'] ?? $data['courseId'] ?? ''),
        ':class'  => (string)($data['ClassID'] ?? $data['classId'] ?? ($data['Data']['ClassId'] ?? '')),
        ':payload'=> $raw !== '' ? $raw : json_encode($data, JSON_UNESCAPED_UNICODE),
    ]);

    // ── 시험/답안카드 성적이면 classin_scores 로 정리 적재 ──────────
    //   AnswerSheetScore = OMR 답안카드(자동 채점) ← 월말평가 핵심
    //   ExamScore        = LMS 테스트(측험)
    //   HomeworkScore    = 작업(숙제) 채점
    if (in_array($cmd, ['AnswerSheetScore', 'ExamScore', 'HomeworkScore'], true)) {
        saveScore($pdo, $cmd, $data);
    }

    // 그 외 유형별 집계가 필요하면 여기서 분기:
    //   - Enter/Exit  → 출석 카운트
    //   - Rewards     → 트로피 누적
    //   - Selector    → 정답률
    //   - End(ClassSummary) → 수업 리포트
    //   - Record/Upload     → recordings 테이블에 다시보기 등록

} catch (Throwable $e) {
    // DB 실패해도 클래스인에는 200 을 주되, 로그로 남겨 재처리.
    logline('HOOK_DBEX', $e->getMessage());
}

// 5) 빠르게 성공 응답 (클래스인 규칙: 정상 수신 응답)
reply(['errno' => 1, 'error' => 'ok']);

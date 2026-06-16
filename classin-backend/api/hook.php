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

    // 원본 이벤트는 통째로 보관 (스키마 변화에 안전)
    $st = $pdo->prepare(
        "INSERT INTO classin_events (cmd, school_id, course_id, class_id, payload, received_at)
         VALUES (:cmd, :school, :course, :class, :payload, NOW())"
    );
    $st->execute([
        ':cmd'    => (string)($data['cmd'] ?? $data['action'] ?? 'unknown'),
        ':school' => (string)($data['schoolId'] ?? $CONFIG['SID']),
        ':course' => (string)($data['courseId'] ?? ''),
        ':class'  => (string)($data['classId'] ?? ''),
        ':payload'=> $raw !== '' ? $raw : json_encode($data, JSON_UNESCAPED_UNICODE),
    ]);

    // 필요하면 여기서 유형별 집계 테이블도 갱신:
    //   - Enter/Exit  → 출석 카운트
    //   - Rewards     → 트로피 누적
    //   - Selector    → 정답률
    //   - ClassSummary→ 수업 리포트
    //   - RecordingFile → recordings 테이블에 다시보기 등록

} catch (Throwable $e) {
    // DB 실패해도 클래스인에는 200 을 주되, 로그로 남겨 재처리.
    logline('HOOK_DBEX', $e->getMessage());
}

// 5) 빠르게 성공 응답 (클래스인 규칙: 정상 수신 응답)
reply(['errno' => 1, 'error' => 'ok']);

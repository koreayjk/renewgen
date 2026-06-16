<?php
/* ──────────────────────────────────────────────────────────────────
 *  recordings.php — 다시보기 / 녹화본 재생 주소 (Broadcast)
 *  ────────────────────────────────────────────────────────────────
 *  클래스인: action=getWebcastUrl
 *     → 라이브 재생(live) · 다시보기(replay) · 플레이어 주소 반환
 *
 *  "영상 판매" 흐름의 핵심:
 *   1) 구매/수강권 확인은 우리 DB(아래 checkAccess)에서 먼저 한다.
 *   2) 통과한 사람에게만 이 API로 재생 주소를 발급한다.
 *   3) 주소를 프론트에 그대로 노출하지 말고, 짧은 만료의 재생 주소를
 *      받아 플레이어에 넘긴다. (URL 직접 공유 방지)
 * ──────────────────────────────────────────────────────────────── */

require __DIR__ . '/_bootstrap.php';

$in = input();
$uid      = trim((string)($in['uid'] ?? ''));
$courseId = trim((string)($in['courseId'] ?? ''));
$classId  = trim((string)($in['classId'] ?? '')); // 특정 회차 다시보기

if ($courseId === '') fail('courseId 가 필요합니다.');

// ── 판매/수강권 게이트: 구매하지 않은 영상은 막는다 ──────────────
if (!checkAccess($CONFIG, $uid, $courseId, $classId)) {
    fail('이 영상의 수강권이 없습니다. 구매 후 시청할 수 있습니다.', 402); // 402 Payment Required
}

try {
    $ci = new ClassIn($CONFIG);
    $params = ['courseId' => $courseId];
    if ($classId !== '') $params['classId'] = $classId;

    $resp = $ci->call('getWebcastUrl', $params);

    if (!ClassIn::ok($resp)) {
        logline('REC_FAIL', $resp);
        fail('재생 주소 조회 실패 (errno=' . ($resp['error_info']['errno'] ?? '?') . ')', 502);
    }

    // 반환 형태는 회차별 live/replay 주소 묶음. 그대로 전달하되
    // 필요하면 여기서 가공하세요.
    reply([
        'ok'   => true,
        'data' => $resp['data'] ?? $resp,
    ]);

} catch (Throwable $e) {
    logline('REC_EX', $e->getMessage());
    fail('서버 오류: ' . $e->getMessage(), 500);
}

/**
 * 수강권/구매 확인 — 우리 DB에서 판단.
 * purchases 테이블에 (uid, course_id, class_id, expires_at) 가 있으면 통과.
 * 무료 공개 강의는 courses.is_free = 1 로 두면 통과시키는 식으로 확장.
 */
function checkAccess(array $cfg, string $uid, string $courseId, string $classId): bool
{
    if ($uid === '') return false;
    try {
        $pdo = db($cfg);
        $sql = "SELECT COUNT(*) FROM purchases
                WHERE uid = :uid AND course_id = :course
                  AND (class_id = :class OR class_id = '' OR class_id IS NULL)
                  AND (expires_at IS NULL OR expires_at > NOW())";
        $st = $pdo->prepare($sql);
        $st->execute([':uid' => $uid, ':course' => $courseId, ':class' => $classId]);
        return (int)$st->fetchColumn() > 0;
    } catch (Throwable $e) {
        logline('ACCESS_EX', $e->getMessage());
        return false; // DB 오류 시 보수적으로 차단
    }
}

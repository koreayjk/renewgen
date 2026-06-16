<?php
/* ──────────────────────────────────────────────────────────────────
 *  scores.php — 시험/답안카드 성적 조회 (어드민 성적표가 호출)
 *  ────────────────────────────────────────────────────────────────
 *  hook.php 가 classin_scores 에 적재해 둔 ClassIn 성적을 읽어
 *  홈페이지 어드민(성적표 매니저)에 돌려줍니다. CSV 업로드를 대체합니다.
 *
 *  · GET ?action=activities
 *       → 성적이 들어온 "시험(활동)" 목록 (회차 선택용)
 *  · GET ?action=rows&ids=63919314,63919315[&cmd=AnswerSheetScore]
 *       → 선택한 시험들의 학생별 성적 행 (프론트가 회차로 조립)
 *  · GET ?action=rows&since=2026-06-01
 *       → 그 날짜 이후 채점된 성적 전체
 *
 *  ⚠️ 운영에서는 로그인한 관리자만 호출하도록 세션/토큰 검증을 붙이세요.
 * ──────────────────────────────────────────────────────────────── */

require __DIR__ . '/_bootstrap.php';

$in     = input();
$action = (string)($in['action'] ?? 'activities');

// 성적 종류 필터 (기본: OMR 답안카드)
$cmd = (string)($in['cmd'] ?? 'AnswerSheetScore');
$cmdOk = in_array($cmd, ['AnswerSheetScore', 'ExamScore', 'HomeworkScore', 'all'], true) ? $cmd : 'AnswerSheetScore';

try {
    $pdo = db($CONFIG);

    if ($action === 'activities') {
        // 회차 선택 UI 용 — 시험(활동) 단위 요약
        $where = $cmdOk === 'all' ? '1=1' : 'cmd = :cmd';
        $sql = "SELECT activity_id, MAX(activity_name) AS activity_name,
                       MAX(course_name) AS course_name, MAX(unit_name) AS unit_name,
                       MAX(cmd) AS cmd, MAX(max_score) AS max_score,
                       COUNT(*) AS student_count,
                       MAX(corrected_at) AS last_corrected,
                       MAX(submitted_at) AS last_submitted
                FROM classin_scores
                WHERE $where
                GROUP BY activity_id
                ORDER BY last_corrected DESC, last_submitted DESC
                LIMIT 500";
        $st = $pdo->prepare($sql);
        if ($cmdOk !== 'all') $st->bindValue(':cmd', $cmdOk);
        $st->execute();
        reply(['ok' => true, 'activities' => $st->fetchAll()]);
    }

    if ($action === 'rows') {
        $conds = []; $args = [];
        if ($cmdOk !== 'all') { $conds[] = 'cmd = ?'; $args[] = $cmdOk; }

        $ids = trim((string)($in['ids'] ?? ''));
        if ($ids !== '') {
            $list = array_values(array_filter(array_map('trim', explode(',', $ids))));
            if ($list) {
                $conds[] = 'activity_id IN (' . implode(',', array_fill(0, count($list), '?')) . ')';
                foreach ($list as $v) $args[] = $v;
            }
        }
        $since = trim((string)($in['since'] ?? ''));
        if ($since !== '') { $conds[] = '(corrected_at >= ? OR submitted_at >= ?)'; $args[] = $since; $args[] = $since; }

        $where = $conds ? ('WHERE ' . implode(' AND ', $conds)) : '';
        $sql = "SELECT cmd, course_id, course_name, unit_id, unit_name,
                       activity_id, activity_name, class_id,
                       student_uid, student_name, student_account, member_id,
                       max_score, score, scoring_rate, topic_json,
                       submitted_at, corrected_at
                FROM classin_scores
                $where
                ORDER BY activity_id, score DESC
                LIMIT 20000";
        $st = $pdo->prepare($sql);
        $st->execute($args);

        $rows = array_map(function ($r) {
            $r['topics'] = $r['topic_json'] ? json_decode($r['topic_json'], true) : null;
            unset($r['topic_json']);
            return $r;
        }, $st->fetchAll());

        reply(['ok' => true, 'count' => count($rows), 'rows' => $rows]);
    }

    fail('알 수 없는 action: ' . $action, 400);

} catch (Throwable $e) {
    logline('SCORES_EX', $e->getMessage());
    fail('서버 오류: ' . $e->getMessage(), 500);
}

/* global window */
// ──────────────────────────────────────────────────────────────────
//  시험 시스템 ↔ Supabase 동기화
//   · localStorage 를 즉각 캐시로 쓰고, Supabase 를 영구 저장소로 사용
//   · 로그인 시 원격 → 로컬 하이드레이트 · 제출/채점/출제 시 원격 업서트
//   · Supabase 미연결/테이블 미생성 시에는 조용히 로컬만 사용(폴백)
//
//  필요 테이블(아래 SQL 을 Supabase SQL Editor 에서 1회 실행):
//    classin-backend/supabase-exam-schema.sql
//
//   exams(id text pk, data jsonb, created_by uuid, updated_at)
//   exam_attempts(exam_id text, user_id uuid, data jsonb, score int,
//                 graded bool, submitted_at, pk(exam_id,user_id))
// ──────────────────────────────────────────────────────────────────

function _examSb() { return (window.getSupabase && window.getSupabase()) || null; }
function _uid() { const u = window.RJ_CURRENT_USER; return u && u.id ? u.id : null; }

// 연결 상태(배지용): "connected" | "local"
let _examSbState = "local";
function examSbStatus() { return _examSbState; }

// ── 원격 → 로컬 하이드레이트 ────────────────────────────────────────
async function pullExams() {
  const sb = _examSb(); if (!sb) return false;
  try {
    const { data, error } = await sb.from("exams").select("data");
    if (error) { _examSbState = "local"; return false; }
    _examSbState = "connected";
    const store = window.loadExamStore();
    const remote = (data || []).map((r) => r.data).filter(Boolean);
    // 원격 custom 으로 교체(같은 id 는 원격 우선), seed 는 EXAMS_SEED 가 따로 보유
    const byId = {};
    for (const c of (store.custom || [])) byId[c.id] = c;
    for (const e of remote) byId[e.id] = e;
    store.custom = Object.values(byId);
    window.saveExamStore(store);
    return true;
  } catch (e) { _examSbState = "local"; return false; }
}

async function pullAttempts(user) {
  const sb = _examSb(); const uid = (user && user.id) || _uid(); if (!sb || !uid) return false;
  try {
    const { data, error } = await sb.from("exam_attempts").select("exam_id, data").eq("user_id", uid);
    if (error) return false;
    const store = window.loadExamStore();
    for (const row of (data || [])) if (row.data) store.attempts[row.exam_id] = row.data;  // 원격 우선 병합(로컬 전용은 유지)
    window.saveExamStore(store);
    return true;
  } catch (e) { return false; }
}

async function pullExamData(user) {
  const a = await pullExams();
  const b = await pullAttempts(user);
  if ((a || b) && window.__rjExamSynced) window.__rjExamSynced();
  return a || b;
}

// ── 로컬 → 원격 업서트 ──────────────────────────────────────────────
async function pushExam(exam, user) {
  const sb = _examSb(); const uid = (user && user.id) || _uid(); if (!sb || !exam) return false;
  try {
    const { error } = await sb.from("exams").upsert({ id: exam.id, data: exam, created_by: uid, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) return false;
    _examSbState = "connected"; return true;
  } catch (e) { return false; }
}

async function deleteRemoteExam(id) {
  const sb = _examSb(); if (!sb) return;
  try { await sb.from("exams").delete().eq("id", id); } catch (e) {}
}

// 응시 제출/채점 시 자동 호출(exam-data.saveAttempt 훅)
function pushAttempt(examId, attempt) {
  const sb = _examSb(); const uid = _uid(); if (!sb || !uid || !attempt) return;
  let score = attempt.autoScore || 0;
  const ex = window.findExam && window.findExam(examId);
  if (ex && window.finalScore) { const f = window.finalScore(ex, attempt); if (f != null) score = f; }
  try {
    sb.from("exam_attempts").upsert({
      exam_id: examId, user_id: uid, data: attempt, score,
      graded: !!attempt.graded, submitted_at: new Date().toISOString(),
    }, { onConflict: "exam_id,user_id" }).then(({ error }) => { if (!error) _examSbState = "connected"; });
  } catch (e) {}
}
function deleteAttempt(examId) {
  const sb = _examSb(); const uid = _uid(); if (!sb || !uid) return;
  try { sb.from("exam_attempts").delete().eq("exam_id", examId).eq("user_id", uid); } catch (e) {}
}

// 관리자: 한 시험의 전체 제출본 조회(채점·현황용)
async function listAttempts(examId) {
  const sb = _examSb(); if (!sb) return [];
  try {
    const { data, error } = await sb.from("exam_attempts").select("user_id, data, score, graded, submitted_at").eq("exam_id", examId);
    if (error) return [];
    return data || [];
  } catch (e) { return []; }
}

// exam-data 훅 연결
window.__rjPushAttempt = pushAttempt;
window.__rjDeleteAttempt = deleteAttempt;

Object.assign(window, {
  pullExams, pullAttempts, pullExamData, pushExam, deleteRemoteExam,
  pushExamAttempt: pushAttempt, listAttempts, examSbStatus,
});

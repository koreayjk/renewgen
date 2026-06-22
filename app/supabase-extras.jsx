/* global window */
// ─────────────────────────────────────────────────────────────────
//  부가 데이터 — Supabase 동기화 (시험 리마인드 · AI 생성 사용량)
//   · exam_reminders : 정기고사 리마인드 발송 기록 → 모든 강사·관리자가 공유
//   · ai_usage       : 강사별 하루 AI 생성 횟수·비용 → 기기 바꿔도 한도가 유지됨
//   · 로컬스토리지(rj_exam_reminders / rj_ai_gen_usage)는 캐시로 유지
//
//   미배포(Supabase 미연결) 시: 모든 함수가 조용히 no-op → 기존 로컬 동작 유지
//   필요한 SQL: classin-backend/db/supabase-extras.sql 를 1회 실행
// ─────────────────────────────────────────────────────────────────

const RJ_REM_CACHE_KEY = "rj_exam_reminders";
const RJ_AIU_CACHE_KEY = "rj_ai_gen_usage";

function _rjSbX() { return window.getSupabase && window.getSupabase(); }

// ── 시험 리마인드 ───────────────────────────────────────────────────
async function rjPullExamReminders() {
  const sb = _rjSbX(); if (!sb) return { ok: false, reminders: null };
  try {
    const { data, error } = await sb.from("exam_reminders").select("exam_id,at");
    if (error) return { ok: false, error: error.message };
    const reminders = {};
    for (const r of data || []) reminders[r.exam_id] = { at: r.at ? new Date(r.at).getTime() : Date.now() };
    return { ok: true, reminders };
  } catch (e) { return { ok: false, error: String(e) }; }
}

async function rjPushExamReminder(examId, atMs) {
  const sb = _rjSbX(); if (!sb || !examId) return { ok: false };
  try {
    const row = { exam_id: examId, at: new Date(atMs || Date.now()).toISOString() };
    const { error } = await sb.from("exam_reminders").upsert(row, { onConflict: "exam_id" });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

async function rjSyncExamRemindersFromCloud() {
  const sb = _rjSbX(); if (!sb) return { ok: false, available: false };
  const r = await rjPullExamReminders();
  if (!r.ok) return { ok: false, available: true, error: r.error };
  const n = Object.keys(r.reminders).length;
  if (n) { try { localStorage.setItem(RJ_REM_CACHE_KEY, JSON.stringify(r.reminders)); } catch (e) {} }
  return { ok: true, available: true, loaded: n };
}

// ── AI 생성 사용량 (user_id + day) ──────────────────────────────────
async function rjPullAiUsage(userId, day) {
  const sb = _rjSbX(); if (!sb || !userId) return { ok: false, usage: null };
  try {
    const { data, error } = await sb.from("ai_usage").select("day,count,krw").eq("user_id", userId).eq("day", day).maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, usage: data ? { date: data.day, count: data.count || 0, krw: Number(data.krw) || 0 } : null };
  } catch (e) { return { ok: false, error: String(e) }; }
}

async function rjPushAiUsage(userId, day, count, krw) {
  const sb = _rjSbX(); if (!sb || !userId) return { ok: false };
  try {
    const row = { user_id: userId, day, count: count || 0, krw: krw || 0 };
    const { error } = await sb.from("ai_usage").upsert(row, { onConflict: "user_id,day" });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// 클라우드의 오늘 사용량을 로컬 캐시에 반영 → 한도 판정이 기기 간 일관되게.
//   클라우드가 더 크면 클라우드 우선(다른 기기에서 쓴 분 반영), 없으면 로컬 그대로.
async function rjSyncAiUsageFromCloud(userId) {
  const sb = _rjSbX(); if (!sb || !userId) return { ok: false, available: false };
  const day = new Date().toISOString().slice(0, 10);
  const r = await rjPullAiUsage(userId, day);
  if (!r.ok) return { ok: false, available: true, error: r.error };
  let local = {}; try { local = JSON.parse(localStorage.getItem(RJ_AIU_CACHE_KEY) || "{}") || {}; } catch (e) {}
  if (local.date !== day) local = { date: day, count: 0, krw: 0 };
  const cloud = r.usage;
  if (cloud) {
    // 두 값 중 큰 쪽 채택(이미 쓴 한도를 놓치지 않도록)
    const merged = { date: day, count: Math.max(local.count || 0, cloud.count || 0), krw: Math.max(local.krw || 0, cloud.krw || 0) };
    try { localStorage.setItem(RJ_AIU_CACHE_KEY, JSON.stringify(merged)); } catch (e) {}
    // 로컬이 더 컸으면 클라우드도 끌어올림
    if ((local.count || 0) > (cloud.count || 0) || (local.krw || 0) > (cloud.krw || 0)) rjPushAiUsage(userId, day, merged.count, merged.krw).catch(() => {});
    return { ok: true, available: true, usage: merged };
  }
  // 클라우드에 없고 로컬에 있으면 업로드(이관)
  if ((local.count || 0) > 0 || (local.krw || 0) > 0) rjPushAiUsage(userId, day, local.count, local.krw).catch(() => {});
  return { ok: true, available: true, usage: local };
}

Object.assign(window, {
  rjPullExamReminders, rjPushExamReminder, rjSyncExamRemindersFromCloud,
  rjPullAiUsage, rjPushAiUsage, rjSyncAiUsageFromCloud,
});

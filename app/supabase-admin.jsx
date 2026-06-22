/* global window */
// ─────────────────────────────────────────────────────────────────
//  관리자 학생 명부 — Supabase 동기화
//   · 관리자가 편집한 학생 오버라이드(상태·반·수강권·메모 등)를 클라우드에 저장
//     → 어느 컴퓨터·브라우저·관리자 계정에서든 같은 명부가 보임
//   · 학생 본인은 자기 행만 읽어, 수강권 판정(access.jsx · rosterGrant)에 사용
//   · 로컬스토리지(rj-admin-students)는 캐시로 유지
//
//   미배포(Supabase 미연결) 시: 모든 함수가 조용히 no-op → 기존 로컬 동작 유지
//   필요한 SQL: classin-backend/db/supabase-admin-stores.sql 를 1회 실행
// ─────────────────────────────────────────────────────────────────

const RJ_STU_CACHE_KEY = "rj-admin-students";

function _rjSbAd() { return window.getSupabase && window.getSupabase(); }

// ── 조회 → { [uid]: data } 형태(로컬 오버라이드 객체와 동일) ──────────
async function rjPullStudentsFromCloud() {
  const sb = _rjSbAd(); if (!sb) return { ok: false, students: null };
  try {
    const { data, error } = await sb.from("admin_students").select("uid,email,data");
    if (error) return { ok: false, error: error.message };
    const students = {};
    for (const r of data || []) {
      students[r.uid] = { ...(r.data || {}) };
      if (r.email && students[r.uid].email == null) students[r.uid].email = r.email;
    }
    return { ok: true, students };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// ── 저장(추가/수정 공용) — uid 1명분 오버라이드 ──────────────────────
async function rjPushStudentToCloud(uid, data, email) {
  const sb = _rjSbAd(); if (!sb || !uid) return { ok: false };
  try {
    const row = { uid, email: (email || (data && data.email) || null), data: data || {} };
    const { error } = await sb.from("admin_students").upsert(row, { onConflict: "uid" });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// ── 전체 동기화 (관리자 페이지 로드 시) ──────────────────────────────
//   클라우드 → 로컬 캐시 교체. 비어 있으면 로컬은 그대로(업로드는 호출측에서 이관).
async function rjSyncStudentsFromCloud() {
  const sb = _rjSbAd(); if (!sb) return { ok: false, available: false };
  const r = await rjPullStudentsFromCloud();
  if (!r.ok) return { ok: false, available: true, error: r.error };
  const n = Object.keys(r.students).length;
  if (n) { try { localStorage.setItem(RJ_STU_CACHE_KEY, JSON.stringify(r.students)); } catch (e) {} }
  return { ok: true, available: true, loaded: n };
}

Object.assign(window, {
  rjPullStudentsFromCloud, rjPushStudentToCloud, rjSyncStudentsFromCloud,
});

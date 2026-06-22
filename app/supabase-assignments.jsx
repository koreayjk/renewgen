/* global window */
// ─────────────────────────────────────────────────────────────────
//  반별 과제·숙제 — Supabase 동기화
//   · 강사가 낸 과제/시험 + 학생별 제출·채점 상태를 클라우드에 저장
//     → 어느 컴퓨터·브라우저·강사 계정에서든 같은 데이터가 보임
//   · 로컬스토리지(rj_class_assignments_v1)는 캐시로 유지 (오프라인·즉시 응답)
//   · 흐름:
//       반 관리 페이지 로드 → rjSyncAssignmentsFromCloud() → 로컬 캐시 교체 → 재렌더
//       과제 추가/제출체크/채점/삭제 → 로컬 저장 즉시 + 클라우드 push (fire-and-forget)
//
//   미배포(Supabase 미연결) 시: 모든 함수가 조용히 no-op → 기존 로컬 동작 유지
//   필요한 SQL: classin-backend/db/supabase-assignments.sql 를 1회 실행
// ─────────────────────────────────────────────────────────────────

const RJ_ASGN_CACHE_KEY = "rj_class_assignments_v1";

function _rjSbA() { return window.getSupabase && window.getSupabase(); }

// 클라우드 행 → 앱 과제 객체
function _rjAsgnFromRow(r) {
  return {
    id: r.id,
    classId: r.class_id,
    type: r.type || "homework",
    title: r.title || "",
    detail: r.detail || "",
    due: r.due || "",
    createdAt: r.created_at || new Date().toISOString(),
    submissions: (r.data && r.data.submissions) || {},
  };
}

// 앱 과제 객체 → 클라우드 행
function _rjAsgnToRow(a) {
  return {
    id: a.id,
    class_id: a.classId || "",
    type: a.type || "homework",
    title: a.title || "",
    detail: a.detail || "",
    due: a.due || "",
    created_at: a.createdAt || new Date().toISOString(),
    data: { submissions: a.submissions || {} },
  };
}

// ── 조회 ───────────────────────────────────────────────────────────
async function rjPullAssignmentsFromCloud() {
  const sb = _rjSbA(); if (!sb) return { ok: false, assignments: null };
  try {
    const { data, error } = await sb.from("class_assignments")
      .select("id,class_id,type,title,detail,due,created_at,data")
      .order("created_at", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, assignments: (data || []).map(_rjAsgnFromRow) };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// ── 저장(추가/수정 공용) ────────────────────────────────────────────
async function rjPushAssignmentToCloud(assignment) {
  const sb = _rjSbA(); if (!sb || !assignment || !assignment.id) return { ok: false };
  try {
    const { error } = await sb.from("class_assignments").upsert(_rjAsgnToRow(assignment), { onConflict: "id" });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// ── 삭제 ───────────────────────────────────────────────────────────
async function rjDeleteAssignmentFromCloud(asgId) {
  const sb = _rjSbA(); if (!sb || !asgId) return { ok: false };
  try {
    const { error } = await sb.from("class_assignments").delete().eq("id", asgId);
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// ── 전체 동기화 (페이지 로드 시) ─────────────────────────────────────
//   클라우드 → 로컬 캐시 교체. 클라우드가 비어 있으면 로컬은 그대로 유지(업로드 대기).
async function rjSyncAssignmentsFromCloud() {
  const sb = _rjSbA(); if (!sb) return { ok: false, available: false };
  const r = await rjPullAssignmentsFromCloud();
  if (!r.ok) return { ok: false, available: true, error: r.error };
  if (r.assignments.length) {
    // 클라우드에 데이터가 있으면 그것을 정본으로 → 로컬 캐시 교체
    try { localStorage.setItem(RJ_ASGN_CACHE_KEY, JSON.stringify(r.assignments)); } catch (e) {}
    return { ok: true, available: true, loaded: r.assignments.length };
  }
  // 클라우드가 비어 있고 로컬에 기존 과제가 있으면 → 최초 1회 자동 업로드(이관)
  //   (덮어쓸 클라우드 데이터가 없으므로 안전)
  const back = await rjBackupAssignmentsToCloud();
  return { ok: true, available: true, loaded: 0, migrated: back.pushed || 0 };
}

// ── 로컬 → 클라우드 일괄 백업 (최초 1회 이관용) ──────────────────────
async function rjBackupAssignmentsToCloud() {
  const sb = _rjSbA(); if (!sb) return { ok: false, available: false };
  let list = [];
  try { const s = JSON.parse(localStorage.getItem(RJ_ASGN_CACHE_KEY) || "[]"); if (Array.isArray(s)) list = s; } catch (e) {}
  let pushed = 0, failed = 0;
  for (const a of list) { const res = await rjPushAssignmentToCloud(a); if (res.ok) pushed++; else failed++; }
  return { ok: true, available: true, pushed, failed };
}

Object.assign(window, {
  rjPullAssignmentsFromCloud, rjPushAssignmentToCloud, rjDeleteAssignmentFromCloud,
  rjSyncAssignmentsFromCloud, rjBackupAssignmentsToCloud,
});

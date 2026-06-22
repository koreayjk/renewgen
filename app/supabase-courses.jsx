/* global window */
// ─────────────────────────────────────────────────────────────────
//  강좌 커스텀 · 추가 강사 — Supabase 동기화
//   · 관리자가 바꾼 강좌(영상/판매설정/개설)와 추가한 강사를 클라우드에 저장
//     → 모든 운영자·방문자가 동일한 카탈로그를 봄 (한 PC에만 갇히지 않음)
//   · 로컬스토리지(rj_courses_store_v1 / rj_instructors_store_v1)는 캐시로 유지
//   · 흐름: 앱 로드 → rjSyncCoursesFromCloud() → 로컬 캐시 교체 → applyCoursesStore()/applyInstrStore() → 재렌더
//           편집/개설/강사추가 → 로컬 저장 즉시 + 클라우드 push (fire-and-forget)
//
//   미배포(Supabase 미연결) 시: 모든 함수가 조용히 no-op → 기존 로컬 동작 유지
//   필요한 SQL: classin-backend/db/supabase-admin-stores.sql 를 1회 실행 (site_store 테이블)
// ─────────────────────────────────────────────────────────────────

const RJ_COURSES_CACHE_KEY = "rj_courses_store_v1";
const RJ_INSTR_CACHE_KEY = "rj_instructors_store_v1";

function _rjSbC() { return window.getSupabase && window.getSupabase(); }

// ── site_store 단일 키 조회/저장 ────────────────────────────────────
async function rjPullSiteStore(key) {
  const sb = _rjSbC(); if (!sb) return { ok: false, data: null };
  try {
    const { data, error } = await sb.from("site_store").select("data").eq("key", key).maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ? data.data : null };
  } catch (e) { return { ok: false, error: String(e) }; }
}
async function rjPushSiteStore(key, data) {
  const sb = _rjSbC(); if (!sb || !key) return { ok: false };
  try {
    const { error } = await sb.from("site_store").upsert({ key, data: data || {} }, { onConflict: "key" });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// ── 강좌 커스텀 / 추가 강사 push (저장 시 호출) ───────────────────────
function rjPushCoursesStore(store) { return rjPushSiteStore("courses", store || {}); }
function rjPushInstrStore(list) { return rjPushSiteStore("instructors", Array.isArray(list) ? list : []); }

// ── 전체 동기화 (앱 로드 시) ────────────────────────────────────────
//   클라우드에 값이 있으면 그것을 정본으로 로컬 캐시 교체 → 적용.
//   클라우드가 비어 있고 로컬에 기존 편집분이 있으면 → 최초 1회 자동 업로드(이관).
async function rjSyncCoursesFromCloud() {
  const sb = _rjSbC(); if (!sb) return { ok: false, available: false };
  let changed = false;
  try {
    const [c, i] = await Promise.all([rjPullSiteStore("courses"), rjPullSiteStore("instructors")]);

    // 강좌
    if (c.ok && c.data && (c.data.overrides || c.data.custom)) {
      try { localStorage.setItem(RJ_COURSES_CACHE_KEY, JSON.stringify(c.data)); changed = true; } catch (e) {}
    } else if (c.ok) {
      let local = null; try { local = JSON.parse(localStorage.getItem(RJ_COURSES_CACHE_KEY) || "null"); } catch (e) {}
      if (local && (Object.keys(local.overrides || {}).length || (local.custom || []).length)) rjPushCoursesStore(local).catch(() => {});
    }

    // 강사
    if (i.ok && Array.isArray(i.data) && i.data.length) {
      try { localStorage.setItem(RJ_INSTR_CACHE_KEY, JSON.stringify(i.data)); changed = true; } catch (e) {}
    } else if (i.ok) {
      let localI = []; try { const a = JSON.parse(localStorage.getItem(RJ_INSTR_CACHE_KEY) || "[]"); if (Array.isArray(a)) localI = a; } catch (e) {}
      if (localI.length) rjPushInstrStore(localI).catch(() => {});
    }

    // 캐시 교체 후 COURSES / INSTRUCTORS 배열에 재적용
    if (changed) {
      if (window.applyCoursesStore) window.applyCoursesStore();
      if (window.applyInstrStore) window.applyInstrStore();
    }
    return { ok: true, available: true, changed };
  } catch (e) { return { ok: false, available: true, error: String(e) }; }
}

Object.assign(window, {
  rjPullSiteStore, rjPushSiteStore, rjPushCoursesStore, rjPushInstrStore, rjSyncCoursesFromCloud,
});

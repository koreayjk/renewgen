/* global window */
// ──────────────────────────────────────────────────────────────────
//  접근권(Access) 로직 — 영상을 볼 수 있는가?
//  ──────────────────────────────────────────────────────────────────
//  판매 모델:
//   · 월정액 구독자  → 모든 녹화본 무료 시청
//   · 비구독자       → 해당 강의(녹화본)를 구매한 경우에만 시청
//
//  데이터 출처: Supabase
//   · subscriptions : 활성 구독 (user_id, status, expires_at)
//   · enrollments   : 낱개 구매 (user_id, course_id, status, expires_at)
//  미연결(데모) 상태에서는 localStorage 로 흉내냅니다.
// ──────────────────────────────────────────────────────────────────

// 데모용 로컬 구매/구독 저장 (Supabase 미설정 시)
function demoState() {
  try { return JSON.parse(localStorage.getItem("rj-access") || '{"sub":false,"courses":[]}'); }
  catch (e) { return { sub: false, courses: [] }; }
}
function saveDemoState(s) { try { localStorage.setItem("rj-access", JSON.stringify(s)); } catch (e) {} }

// 현재 사용자가 "구독자"인가?
async function isSubscriber(user) {
  if (!user) return false;
  if (demoState().sub) return true; // 시연용 데모 구독
  const sb = window.getSupabase && window.getSupabase();
  if (!sb) return false;
  try {
    const { data, error } = await sb
      .from("subscriptions")
      .select("status, expires_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (error || !data) return false;
    if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
    return true;
  } catch (e) { return false; }
}

// 특정 강의(녹화본)를 구매했는가?
async function hasPurchased(user, courseId) {
  if (!user) return false;
  if (demoState().courses.includes(courseId)) return true; // 시연용 데모 구매
  const sb = window.getSupabase && window.getSupabase();
  if (!sb) return false;
  try {
    const { data, error } = await sb
      .from("enrollments")
      .select("status, expires_at")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("status", "active")
      .maybeSingle();
    if (error || !data) return false;
    if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
    return true;
  } catch (e) { return false; }
}

// 종합 판정 → { canWatch, reason }
//  reason: 'subscriber' | 'purchased' | 'free' | 'need-login' | 'locked'
async function resolveAccess(user, course) {
  if (course && course.isFree) return { canWatch: true, reason: "free" };
  if (!user) return { canWatch: false, reason: "need-login" };
  if (await isSubscriber(user)) return { canWatch: true, reason: "subscriber" };
  if (await hasPurchased(user, course.id)) return { canWatch: true, reason: "purchased" };
  return { canWatch: false, reason: "locked" };
}

// 데모 구매/구독 (결제 붙기 전 시연용)
function demoSubscribe() { const s = demoState(); s.sub = true; saveDemoState(s); }
function demoBuyCourse(courseId) { const s = demoState(); if (!s.courses.includes(courseId)) s.courses.push(courseId); saveDemoState(s); }
function demoReset() { saveDemoState({ sub: false, courses: [] }); }

Object.assign(window, {
  isSubscriber, hasPurchased, resolveAccess,
  demoSubscribe, demoBuyCourse, demoReset, demoAccessState: demoState,
});

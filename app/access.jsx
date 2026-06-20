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

// 관리자 명부(학생 관리)에서 부여한 권한 → 무료 시청
//  · 학생에게 이 강의를 '배정' → 수강생 무료 다시보기 (reason: 'enrolled')
//  · 학생 수강권을 '프리패스(구독)'로 설정 → 모든 강의 무료 (reason: 'subscriber')
//  · 학생의 반(label)이 강의에 지정된 반 이름과 일치 → 그 반 수강생 무료 (reason: 'enrolled')
function _normClass(s) { return String(s || "").trim().toLowerCase().replace(/\s+/g, ""); }
function courseClassNames(course) {
  // course.className 또는 course.classNames("고2, 중등A" 처럼 쉼표 구분) 지원
  const raw = course && (course.classNames || course.className) || "";
  return String(raw).split(/[,/·]/).map(_normClass).filter(Boolean);
}
function rosterGrant(user, course) {
  try {
    const finder = window.rjFindStudentByEmail;
    if (!finder || !user || !user.email || !course) return null;
    const stu = finder(user.email);
    if (!stu) return null;
    if (stu.status === "stopped") return null;          // 정지된 계정은 시청 불가
    if (stu.plan === "subscription") return "subscriber";
    if (Array.isArray(stu.courses) && stu.courses.includes(course.id)) return "enrolled";
    // 반 이름 자동 매칭: 강의에 지정된 반 ⊇ 학생의 반(label)
    const classes = courseClassNames(course);
    if (classes.length && stu.label && classes.includes(_normClass(stu.label))) return "enrolled";
    return null;
  } catch (e) { return null; }
}

// 종합 판정 → { canWatch, reason }
//  reason: 'subscriber' | 'purchased' | 'enrolled' | 'staff' | 'free' | 'need-login' | 'locked'
async function resolveAccess(user, course) {
  if (course && course.isFree) return { canWatch: true, reason: "free" };
  // 관리자·강사(staff)는 모든 강의를 미리보기·점검 목적으로 항상 시청 가능
  if (user && window.isStaff && window.isStaff(user)) return { canWatch: true, reason: "staff" };
  if (!user) return { canWatch: false, reason: "need-login" };
  if (await isSubscriber(user)) return { canWatch: true, reason: "subscriber" };
  if (await hasPurchased(user, course.id)) return { canWatch: true, reason: "purchased" };
  // 관리자가 명부에서 배정/프리패스를 부여한 수강생 → 무료
  const g = rosterGrant(user, course);
  if (g) return { canWatch: true, reason: g };
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

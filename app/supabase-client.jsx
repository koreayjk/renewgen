/* global window */
// ──────────────────────────────────────────────────────────────────
//  Supabase 연결 — 리뉴젠 아카데미
//  · 회원가입 / 로그인 / 세션 유지 (Supabase Auth)
//  · 프로필·수강 데이터는 Supabase DB (개인정보는 카페24에 안 쌓임)
//  anon key 는 공개되어도 안전한 키입니다(브라우저 전용). RLS 로 보호.
// ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://psusaorzcvwvdthgbgjb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdXNhb3J6Y3Z3dmR0aGdiZ2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTc5MzIsImV4cCI6MjA5NzEzMzkzMn0.mOGWEg9xJJ5O2Y9PuSdsRjz09K7WZl0WNUM_dywHk64";

let _sb = null;
function getSupabase() {
  if (_sb) return _sb;
  if (!window.supabase || !window.supabase.createClient) return null;
  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "rj-auth" },
  });
  return _sb;
}

// Supabase 사용자 → 우리 앱 user 객체로 변환
function mapSbUser(u) {
  if (!u) return null;
  const md = u.user_metadata || {};
  const name = md.name || (u.email ? u.email.split("@")[0] : "회원");
  const initials = /[가-힣]/.test(name) ? name.slice(-2) : name.slice(0, 2).toUpperCase();
  return { id: u.id, email: u.email, name, initials, grade: md.grade, school: md.school, subject: md.subject, role: getUserRole({ email: u.email, metaRole: md.role }) };
}

// ──────────────────────────────────────────────────────────────────
//  권한(역할) 시스템 — student / teacher / admin
//  · 기본은 모두 student. 관리자 콘솔(/admin)은 teacher·admin 만 진입.
//  · 비밀키·권한부여 등 민감 기능은 admin 전용.
//  · 초기 관리자는 아래 allowlist 로 고정(코드에 박힘) → 항상 admin.
//  · 그 외 등업은 admin 콘솔에서 부여 → localStorage(rj-roles)에 이메일별 저장.
//    (실서버에서는 Supabase profiles.role 로 옮기고 RLS 로 보호하면 됩니다)
// ──────────────────────────────────────────────────────────────────
const RJ_ADMIN_EMAILS = ["koreayjk@gmail.com"]; // 고정 관리자
const RJ_ROLE_RANK = { student: 0, teacher: 1, admin: 2 };

function _emailOf(u) { return (typeof u === "string" ? u : (u && u.email) || "").trim().toLowerCase(); }
function _roleStore() {
  try { return JSON.parse(localStorage.getItem("rj-roles") || "{}") || {}; } catch (e) { return {}; }
}
function _saveRoleStore(s) { try { localStorage.setItem("rj-roles", JSON.stringify(s)); } catch (e) {} }

function getUserRole(u) {
  const e = _emailOf(u);
  if (!e) return "student";
  if (RJ_ADMIN_EMAILS.includes(e)) return "admin";        // 고정 관리자 최우선
  const ov = _roleStore()[e];
  if (ov && RJ_ROLE_RANK[ov] != null) return ov;          // 콘솔에서 부여한 역할
  if (u && typeof u === "object" && u.metaRole && RJ_ROLE_RANK[u.metaRole] != null) return u.metaRole;
  return "student";
}
function setUserRole(email, role) {
  const e = (email || "").trim().toLowerCase();
  if (!e || RJ_ROLE_RANK[role] == null) return false;
  if (RJ_ADMIN_EMAILS.includes(e)) return true;           // 고정 관리자는 강등 불가
  const s = _roleStore();
  if (role === "student") delete s[e]; else s[e] = role;   // student=기본이므로 제거
  _saveRoleStore(s);
  return true;
}
function listRoleGrants() {
  const out = RJ_ADMIN_EMAILS.map((e) => ({ email: e, role: "admin", fixed: true }));
  const s = _roleStore();
  for (const e in s) if (!RJ_ADMIN_EMAILS.includes(e)) out.push({ email: e, role: s[e], fixed: false });
  return out;
}
function isStaff(u) { return RJ_ROLE_RANK[getUserRole(u)] >= 1; }   // teacher or admin
function isAdmin(u) { return getUserRole(u) === "admin"; }

Object.assign(window, { getUserRole, setUserRole, listRoleGrants, isStaff, isAdmin, RJ_ADMIN_EMAILS });

window.getSupabase = getSupabase;
window.mapSbUser = mapSbUser;

// ── 구글 OAuth 로그인 ───────────────────────────────────────────────
// Supabase 대시보드 → Authentication → Providers → Google 를 켜야 작동합니다.
// 로그인 성공 후 돌아올 주소(현재 페이지)로 리디렉션됩니다.
window.signInWithGoogle = async function () {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase 미연결" };
  // 해시(#/login) 떼고 현재 페이지로 복귀 → 복귀 후 #/mypage 로 이동
  const redirectTo = window.location.origin + window.location.pathname + "#/mypage";
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true }; // 구글 페이지로 이동함
};
// UMD 스크립트가 로드됐는지(=실제 인증 사용 가능 여부)
window.SUPABASE_ENABLED = !!(window.supabase && window.supabase.createClient);

// ── 클래스인 라이브 입장 ────────────────────────────────────────────
// 백엔드(enter.php 또는 Supabase Edge Function)가 배포되면 아래를 설정하세요.
//   window.CLASSIN_API = "/classin/api";   (카페24에 PHP 올린 경우)
// 미설정 시에는 사이트 내 강의실 화면으로 진입합니다(현재 상태).
window.CLASSIN_API = window.CLASSIN_API || "";
window.classinEnter = async function ({ uid, courseId, classId }) {
  const base = window.CLASSIN_API;
  if (!base) return { ok: false, reason: "no-backend" };
  try {
    const ua = navigator.userAgent;
    const deviceType = /iPhone|iPad|iPod/i.test(ua) ? 2 : /Android/i.test(ua) ? 3 : 1;
    const res = await fetch(base + "/enter.php", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ uid, courseId, classId, deviceType }),
    });
    if (res.status === 402) return { ok: false, reason: "no-access" };
    const json = await res.json();
    if (!json.ok) return { ok: false, reason: json.msg || "fail" };
    return { ok: true, url: json.invokeUrl || json.launchUrl };
  } catch (e) {
    return { ok: false, reason: "network" };
  }
};

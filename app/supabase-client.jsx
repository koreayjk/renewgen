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
  return { id: u.id, email: u.email, name, initials, grade: md.grade, school: md.school, subject: md.subject };
}

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

// ═════════════════════════════════════════════════════════════════
//  Supabase Edge Function — classin-roster
//  클래스인에서 학생 명부 / 수업(코스) 목록을 조회(pull)해 온다.
//  ──────────────────────────────────────────────────────────────
//  · GET ?type=students[&page=1&num=100]   → 학교 학생 목록
//  · GET ?type=courses[&page=1&num=100]    → 코스(수업) 목록
//  · GET ?action=<정확한액션>&...           → 임의 액션 직접 호출(진단/확정용)
//
//  조회 API 의 정확한 action 이름을 아직 확정 못 해, "후보 액션을 순서대로
//  시도"하고 성공한 응답을 돌려준다. 실제 응답을 확인한 뒤 액션을 고정한다.
//
//  인증(v1): safeKey = md5(SECRET + timeStamp), POST body 에 SID/safeKey/timeStamp.
//  배포: Verify JWT 켠 채로(관리자 전용). 시크릿 CLASSIN_SID/CLASSIN_SECRET 사용.
// ═════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}
async function md5(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  // @ts-ignore
  const hash = await crypto.subtle.digest("MD5", bytes).catch(() => null);
  if (hash) return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const { Md5 } = await import("https://deno.land/std@0.224.0/hash/md5.ts").catch(() => ({ Md5: null }));
  if (Md5) { const m = new Md5(); m.update(bytes); return m.toString(); }
  throw new Error("MD5 미지원");
}

const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") || "koreayjk@gmail.com")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const STAFF_ROLES = ["admin", "staff", "teacher"];

async function callV1(action: string, params: Record<string, any>, SID: string, SECRET: string, apiHost: string) {
  const ts = Math.floor(Date.now() / 1000);
  const safeKey = await md5(SECRET + ts);
  const body = new URLSearchParams();
  body.set("SID", SID); body.set("safeKey", safeKey); body.set("timeStamp", String(ts));
  for (const k in params) body.set(k, String(params[k]));
  const url = apiHost.replace(/\/$/, "") + "/partner/api/course.api.php?action=" + encodeURIComponent(action);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const text = await res.text();
  let j: any; try { j = JSON.parse(text); } catch { j = { _raw: text.slice(0, 2000) }; }
  return { action, httpStatus: res.status, json: j };
}

function looksSuccessful(j: any): boolean {
  if (!j) return false;
  const errno = Number(j?.error_info?.errno ?? j?.error_code ?? j?.errno ?? NaN);
  if (errno === 1 || errno === 0) return true;  // EEO 는 보통 1=성공
  if (j?.data || j?.content || j?.list || j?.result) return true;
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // ── 관리자 인증 ──────────────────────────────────────────────
  const supaPublic = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY") || "",
    { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
  );
  const { data: { user } } = await supaPublic.auth.getUser();
  if (!user) return json({ ok: false, msg: "로그인이 필요합니다" }, 401);
  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  let allowed = ADMIN_EMAILS.includes((user.email || "").toLowerCase());
  if (!allowed) {
    try {
      const { data: prof } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
      allowed = !!prof && STAFF_ROLES.includes(String(prof.role || "").toLowerCase());
    } catch (_e) { /* 거부 */ }
  }
  if (!allowed) return json({ ok: false, msg: "권한이 없습니다(관리자 전용)" }, 403);

  // ── 파라미터 ──────────────────────────────────────────────────
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") || "students").toLowerCase();
  const override = url.searchParams.get("action");
  const page = url.searchParams.get("page") || "1";
  const num = url.searchParams.get("num") || "100";

  const SID = Deno.env.get("CLASSIN_SID");
  const SECRET = Deno.env.get("CLASSIN_SECRET");
  const APIHOST = Deno.env.get("CLASSIN_API_HOST") || "https://api.eeo.cn";
  if (!SID || !SECRET) return json({ ok: false, msg: "서버에 CLASSIN_SID/SECRET 미설정" }, 500);

  // 후보 액션 (문서 확정 전 자동 탐색)
  const candidates = override ? [override]
    : type === "courses"
      ? ["getCourseList", "getSchoolCourseList", "getCourse", "getCourseInfo", "courseList"]
      : ["getSchoolStudentList", "getSchoolStudent", "getStudentList", "getSchoolStudentInfo", "studentList"];

  const params: Record<string, any> = { page, num };

  const attempts: any[] = [];
  try {
    for (const action of candidates) {
      const r = await callV1(action, params, SID, SECRET, APIHOST);
      attempts.push({ action, httpStatus: r.httpStatus, json: r.json });
      if (looksSuccessful(r.json)) {
        return json({ ok: true, matchedAction: action, type, response: r.json });
      }
    }
    return json({ ok: false, msg: "맞는 action 을 못 찾았습니다 — attempts 를 확인해 정확한 이름을 알려주세요", type, attempts });
  } catch (e) {
    return json({ ok: false, msg: "호출 실패: " + String((e as any)?.message ?? e), attempts }, 502);
  }
});

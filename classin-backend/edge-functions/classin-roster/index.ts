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
// 순수 JS MD5 (Web Crypto 는 MD5 미지원 · Deno hash 모듈도 제거됨 → 직접 구현)
function md5(str: string): string {
  function safeAdd(x: number, y: number) { const l = (x & 0xffff) + (y & 0xffff); return (((x >> 16) + (y >> 16) + (l >> 16)) << 16) | (l & 0xffff); }
  function rol(n: number, c: number) { return (n << c) | (n >>> (32 - c)); }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) { return safeAdd(rol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(c ^ (b | ~d), a, b, x, s, t);
  function core(x: number[], len: number) {
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (let i = 0; i < x.length; i += 16) {
      const oa = a, ob = b, oc = c, od = d;
      a = ff(a, b, c, d, x[i] | 0, 7, -680876936); d = ff(d, a, b, c, x[i + 1] | 0, 12, -389564586); c = ff(c, d, a, b, x[i + 2] | 0, 17, 606105819); b = ff(b, c, d, a, x[i + 3] | 0, 22, -1044525330);
      a = ff(a, b, c, d, x[i + 4] | 0, 7, -176418897); d = ff(d, a, b, c, x[i + 5] | 0, 12, 1200080426); c = ff(c, d, a, b, x[i + 6] | 0, 17, -1473231341); b = ff(b, c, d, a, x[i + 7] | 0, 22, -45705983);
      a = ff(a, b, c, d, x[i + 8] | 0, 7, 1770035416); d = ff(d, a, b, c, x[i + 9] | 0, 12, -1958414417); c = ff(c, d, a, b, x[i + 10] | 0, 17, -42063); b = ff(b, c, d, a, x[i + 11] | 0, 22, -1990404162);
      a = ff(a, b, c, d, x[i + 12] | 0, 7, 1804603682); d = ff(d, a, b, c, x[i + 13] | 0, 12, -40341101); c = ff(c, d, a, b, x[i + 14] | 0, 17, -1502002290); b = ff(b, c, d, a, x[i + 15] | 0, 22, 1236535329);
      a = gg(a, b, c, d, x[i + 1] | 0, 5, -165796510); d = gg(d, a, b, c, x[i + 6] | 0, 9, -1069501632); c = gg(c, d, a, b, x[i + 11] | 0, 14, 643717713); b = gg(b, c, d, a, x[i] | 0, 20, -373897302);
      a = gg(a, b, c, d, x[i + 5] | 0, 5, -701558691); d = gg(d, a, b, c, x[i + 10] | 0, 9, 38016083); c = gg(c, d, a, b, x[i + 15] | 0, 14, -660478335); b = gg(b, c, d, a, x[i + 4] | 0, 20, -405537848);
      a = gg(a, b, c, d, x[i + 9] | 0, 5, 568446438); d = gg(d, a, b, c, x[i + 14] | 0, 9, -1019803690); c = gg(c, d, a, b, x[i + 3] | 0, 14, -187363961); b = gg(b, c, d, a, x[i + 8] | 0, 20, 1163531501);
      a = gg(a, b, c, d, x[i + 13] | 0, 5, -1444681467); d = gg(d, a, b, c, x[i + 2] | 0, 9, -51403784); c = gg(c, d, a, b, x[i + 7] | 0, 14, 1735328473); b = gg(b, c, d, a, x[i + 12] | 0, 20, -1926607734);
      a = hh(a, b, c, d, x[i + 5] | 0, 4, -378558); d = hh(d, a, b, c, x[i + 8] | 0, 11, -2022574463); c = hh(c, d, a, b, x[i + 11] | 0, 16, 1839030562); b = hh(b, c, d, a, x[i + 14] | 0, 23, -35309556);
      a = hh(a, b, c, d, x[i + 1] | 0, 4, -1530992060); d = hh(d, a, b, c, x[i + 4] | 0, 11, 1272893353); c = hh(c, d, a, b, x[i + 7] | 0, 16, -155497632); b = hh(b, c, d, a, x[i + 10] | 0, 23, -1094730640);
      a = hh(a, b, c, d, x[i + 13] | 0, 4, 681279174); d = hh(d, a, b, c, x[i] | 0, 11, -358537222); c = hh(c, d, a, b, x[i + 3] | 0, 16, -722521979); b = hh(b, c, d, a, x[i + 6] | 0, 23, 76029189);
      a = hh(a, b, c, d, x[i + 9] | 0, 4, -640364487); d = hh(d, a, b, c, x[i + 12] | 0, 11, -421815835); c = hh(c, d, a, b, x[i + 15] | 0, 16, 530742520); b = hh(b, c, d, a, x[i + 2] | 0, 23, -995338651);
      a = ii(a, b, c, d, x[i] | 0, 6, -198630844); d = ii(d, a, b, c, x[i + 7] | 0, 10, 1126891415); c = ii(c, d, a, b, x[i + 14] | 0, 15, -1416354905); b = ii(b, c, d, a, x[i + 5] | 0, 21, -57434055);
      a = ii(a, b, c, d, x[i + 12] | 0, 6, 1700485571); d = ii(d, a, b, c, x[i + 3] | 0, 10, -1894986606); c = ii(c, d, a, b, x[i + 10] | 0, 15, -1051523); b = ii(b, c, d, a, x[i + 1] | 0, 21, -2054922799);
      a = ii(a, b, c, d, x[i + 8] | 0, 6, 1873313359); d = ii(d, a, b, c, x[i + 15] | 0, 10, -30611744); c = ii(c, d, a, b, x[i + 6] | 0, 15, -1560198380); b = ii(b, c, d, a, x[i + 13] | 0, 21, 1309151649);
      a = ii(a, b, c, d, x[i + 4] | 0, 6, -145523070); d = ii(d, a, b, c, x[i + 11] | 0, 10, -1120210379); c = ii(c, d, a, b, x[i + 2] | 0, 15, 718787259); b = ii(b, c, d, a, x[i + 9] | 0, 21, -343485551);
      a = safeAdd(a, oa); b = safeAdd(b, ob); c = safeAdd(c, oc); d = safeAdd(d, od);
    }
    return [a, b, c, d];
  }
  const bytes = new TextEncoder().encode(str);
  const bin: number[] = [];
  for (let i = 0; i < bytes.length * 8; i += 8) bin[i >> 5] |= bytes[i / 8] << (i % 32);
  const out = core(bin, bytes.length * 8);
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < out.length * 4; i++) {
    s += hex.charAt((out[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf) + hex.charAt((out[i >> 2] >> ((i % 4) * 8)) & 0xf);
  }
  return s;
}

const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") || "koreayjk@gmail.com")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const STAFF_ROLES = ["admin", "staff", "teacher"];

async function callV1(action: string, params: Record<string, any>, SID: string, SECRET: string, apiHost: string) {
  const ts = Math.floor(Date.now() / 1000);
  const safeKey = md5(SECRET + ts);
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
  // 확정된 실존 엔드포인트(권한 부여 후 바로 동작): getStudentList / getCourseList
  const candidates = override ? [override]
    : type === "courses"
      ? ["getCourseList", "getCourseInfo", "getSchoolCourseList", "getCourse", "courseList"]
      : ["getStudentList", "getSchoolStudentList", "getSchoolStudent", "getSchoolStudentInfo", "studentList"];

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

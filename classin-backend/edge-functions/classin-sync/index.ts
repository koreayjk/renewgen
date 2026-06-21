// ═════════════════════════════════════════════════════════════════
//  Supabase Edge Function — classin-sync
//  우리 홈페이지 회원가입 시 클래스인에 학생 계정 자동 등록 + UID 매핑 저장
//  ──────────────────────────────────────────────────────────────
//  배포:
//    1) Supabase → Edge Functions → "Create function" → 이름: classin-sync
//    2) 이 파일 내용 복붙 → Deploy
//    3) 환경변수(Secrets):
//        - CLASSIN_SID      : 클래스인 발급 SID
//        - CLASSIN_SECRET   : 클래스인 발급 SECRET (절대 노출 금지)
//        - CLASSIN_API_HOST : (선택) 기본 https://api.eeo.cn
//        - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (자동 주입)
//    4) 클라이언트는 가입 직후 fetch('/functions/v1/classin-sync', { email, name, telephone })
//
//  ClassIn 인증 규칙(v1):
//    safeKey = md5(SECRET + timeStamp)
//    POST body 에 SID, safeKey, timeStamp 포함
//
//  errno 의미:
//    1   = 신규 등록 성공
//    461 = 이메일이 이미 가입돼 있음 (data 에 기존 UID 가 옵니다)
//    135 = 휴대폰이 이미 가입돼 있음 (data 에 기존 UID)
// ═════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

// md5 — Deno std 의 crypto 모듈 사용 (외부 의존 없음)
async function md5(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  // @ts-ignore  Deno std 의 verify-가능 알고리즘 목록에 md5 가 있습니다
  const hash = await crypto.subtle.digest("MD5", bytes).catch(() => null);
  if (hash) return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // 폴백: md5 모듈
  const { Md5 } = await import("https://deno.land/std@0.224.0/hash/md5.ts").catch(() => ({ Md5: null }));
  if (Md5) { const m = new Md5(); m.update(bytes); return m.toString(); }
  throw new Error("MD5 미지원");
}

async function callClassInRegister(opts: {
  sid: string; secret: string; apiHost: string;
  email: string; password: string; name?: string; telephone?: string; role: "student" | "teacher";
}) {
  const ts = Math.floor(Date.now() / 1000);
  const safeKey = await md5(opts.secret + ts);
  const md5pass = await md5(opts.password);

  const params: Record<string, string | number> = {
    email:             opts.email,
    md5pass,
    addToSchoolMember: opts.role === "teacher" ? 2 : 1,
    SID:               opts.sid,
    safeKey,
    timeStamp:         ts,
  };
  if (opts.name)      params.nickname  = opts.name;
  if (opts.telephone) params.telephone = opts.telephone;

  const body = new URLSearchParams();
  for (const k in params) body.set(k, String(params[k]));

  const url = opts.apiHost.replace(/\/$/, "") + "/partner/api/course.api.php?action=register";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const text = await res.text();
  let parsed: any; try { parsed = JSON.parse(text); } catch { parsed = { _raw: text }; }
  return { httpStatus: res.status, raw: text, json: parsed };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return json({ ok: false, message: "POST 만 지원합니다" }, 405);

  // 인증된 사용자만 본인 계정을 동기화할 수 있게: 호출한 JWT 의 user 정보를 사용
  const supaPublic = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY") || "",
    { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
  );
  const { data: { user } } = await supaPublic.auth.getUser();
  if (!user) return json({ ok: false, message: "로그인이 필요합니다" }, 401);

  let body: { name?: string; telephone?: string; role?: string };
  try { body = await req.json(); } catch { body = {}; }
  const email = user.email || "";
  if (!email) return json({ ok: false, message: "이메일이 없는 계정입니다" }, 400);
  const role = body.role === "teacher" ? "teacher" : "student";
  const name = body.name || (user.user_metadata?.name as string) || "";
  const telephone = body.telephone || (user.user_metadata?.phone as string) || "";

  const SID     = Deno.env.get("CLASSIN_SID");
  const SECRET  = Deno.env.get("CLASSIN_SECRET");
  const APIHOST = Deno.env.get("CLASSIN_API_HOST") || "https://api.eeo.cn";
  if (!SID || !SECRET) return json({ ok: false, message: "서버에 CLASSIN_SID/SECRET 가 설정돼 있지 않습니다" }, 500);

  // 임시 비밀번호 (학생은 사이트 자체 로그인을 쓰고, 클래스인은 원클릭 입장만 쓰므로 직접 사용 X)
  const password = (await md5(email + Date.now() + Math.random())).slice(0, 12);

  let r;
  try {
    r = await callClassInRegister({ sid: SID, secret: SECRET, apiHost: APIHOST, email, password, name, telephone, role });
  } catch (e) {
    return json({ ok: false, message: "클래스인 호출 실패: " + String(e) }, 502);
  }

  const errno = Number(r.json?.error_info?.errno ?? 0);
  const uid   = String(r.json?.data ?? "").trim();

  // errno: 1=신규, 461=이메일 이미가입(기존 UID 반환), 135=휴대폰 이미가입(기존 UID 반환)
  if (!uid && ![1, 461, 135].includes(errno)) {
    return json({ ok: false, code: errno, message: "클래스인 계정 등록 실패", detail: r.json }, 502);
  }

  // profiles 에 매핑 저장 (service_role 로 RLS 우회)
  const supaService = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  await supaService.from("profiles").update({
    classin_uid: uid,
    classin_role: role,
    classin_linked_at: new Date().toISOString(),
  }).eq("id", user.id);

  return json({
    ok: true,
    uid,
    existed:   [461, 135].includes(errno),
    matchedBy: errno === 461 ? "email" : (errno === 135 ? "telephone" : "new"),
    role,
  });
});

// ═════════════════════════════════════════════════════════════════
//  Supabase Edge Function — bbb-room  (v2 실시간 수업: BigBlueButton)
//  ──────────────────────────────────────────────────────────────
//  BBB 방 생성·목록·입장·종료. BBB API 는 SHA-1 체크섬으로 인증한다.
//     checksum = sha1(callName + queryString + secret)
//
//  · GET ?action=list                         → 열린 강의실 목록 (로그인 필요)
//  · POST/GET ?action=create&name=..&id=..     → 강의실 개설 (강사/관리자)
//  · GET ?action=join&id=..                     → 입장 URL 반환 (로그인 사용자)
//  · GET ?action=end&id=..                      → 강의실 종료 (강사/관리자)
//
//  환경변수(Secrets):
//    BBB_URL    : 예) https://test-install.blindsidenetworks.com/bigbluebutton
//    BBB_SECRET : BBB 공유 시크릿
//    (미설정 시 공개 테스트 서버로 폴백 — 개발용)
//  배포: Verify JWT 끄기(브라우저에서 호출·내부에서 로그인 검증).
// ═════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...CORS } });
}
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") || "koreayjk@gmail.com").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const STAFF_ROLES = ["admin", "staff", "teacher"];

// 개발용 공개 테스트 서버 폴백 (운영 시 반드시 BBB_URL/BBB_SECRET 설정)
const BBB_URL = (Deno.env.get("BBB_URL") || "https://test-install.blindsidenetworks.com/bigbluebutton").replace(/\/$/, "");
const BBB_SECRET = Deno.env.get("BBB_SECRET") || "8cd8ef52e8e101574e400365b55e11a6";

async function sha1(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
// BBB API 호출 URL 생성 (체크섬 포함)
async function bbbApiUrl(call: string, params: Record<string, string>): Promise<string> {
  const qs = new URLSearchParams(params).toString();
  const checksum = await sha1(call + qs + BBB_SECRET);
  return `${BBB_URL}/api/${call}?${qs}&checksum=${checksum}`;
}
function xmlTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp("<" + tag + ">([\\s\\S]*?)</" + tag + ">"));
  return m ? m[1].trim() : null;
}
const rid = () => "rj-" + Math.abs(Date.now() % 1e10).toString(36) + Math.floor(1e6 * (Date.now() % 7)).toString(36);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // 로그인 검증
  const supaPublic = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY") || "",
    { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
  const { data: { user } } = await supaPublic.auth.getUser();
  if (!user) return json({ ok: false, msg: "로그인이 필요합니다" }, 401);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  let role = "student", myName = (user.user_metadata?.name as string) || (user.email || "").split("@")[0] || "사용자";
  try {
    const { data: prof } = await svc.from("profiles").select("role, name").eq("id", user.id).maybeSingle();
    if (prof) { if (prof.role) role = String(prof.role); if (prof.name) myName = prof.name; }
  } catch (_e) {}
  const isStaff = ADMIN_EMAILS.includes((user.email || "").toLowerCase()) || STAFF_ROLES.includes(role.toLowerCase());

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "list";

  try {
    // ── 강의실 목록 ──────────────────────────────────────────────
    if (action === "list") {
      const { data } = await svc.from("bbb_rooms").select("id, name, course_id, created_name, active, started_at, created_at").eq("active", true).order("created_at", { ascending: false }).limit(100);
      return json({ ok: true, rooms: data || [] });
    }

    // ── 강의실 개설 (강사/관리자) ─────────────────────────────────
    if (action === "create") {
      if (!isStaff) return json({ ok: false, msg: "강사·관리자만 개설할 수 있습니다" }, 403);
      const name = (url.searchParams.get("name") || "").trim() || (myName + " 강의실");
      const id = (url.searchParams.get("id") || "").trim() || rid();
      const courseId = url.searchParams.get("course_id") || "";
      const modPw = "mod-" + crypto.randomUUID().slice(0, 8);
      const attPw = "att-" + crypto.randomUUID().slice(0, 8);
      const logoutURL = req.headers.get("origin") ? req.headers.get("origin") + "/v2/#/live" : "";

      const createUrl = await bbbApiUrl("create", {
        name, meetingID: id, moderatorPW: modPw, attendeePW: attPw,
        record: "true", autoStartRecording: "false", allowStartStopRecording: "true",
        welcome: "리뉴젠 아카데미 실시간 수업에 오신 것을 환영합니다.",
        logoutURL,
      });
      const res = await fetch(createUrl);
      const xml = await res.text();
      if (xmlTag(xml, "returncode") !== "SUCCESS") {
        return json({ ok: false, msg: "BBB 방 생성 실패: " + (xmlTag(xml, "message") || xml.slice(0, 200)) }, 502);
      }
      await svc.from("bbb_rooms").upsert({
        id, name, moderator_pw: modPw, attendee_pw: attPw, course_id: courseId || null,
        created_by: user.id, created_name: myName, active: true, record: true, started_at: new Date().toISOString(),
      });
      // 개설자는 바로 진행자로 입장
      const joinUrl = await bbbApiUrl("join", { fullName: myName, meetingID: id, password: modPw, redirect: "true", role: "MODERATOR" });
      return json({ ok: true, room: { id, name }, joinUrl });
    }

    // ── 입장 (로그인 사용자) ─────────────────────────────────────
    if (action === "join") {
      const id = (url.searchParams.get("id") || "").trim();
      if (!id) return json({ ok: false, msg: "강의실 id 가 필요합니다" }, 400);
      const { data: room } = await svc.from("bbb_rooms").select("*").eq("id", id).maybeSingle();
      if (!room || !room.active) return json({ ok: false, msg: "열려있는 강의실이 아닙니다" }, 404);
      const asMod = isStaff;
      const joinUrl = await bbbApiUrl("join", {
        fullName: myName, meetingID: id, password: asMod ? room.moderator_pw : room.attendee_pw,
        redirect: "true", role: asMod ? "MODERATOR" : "VIEWER",
      });
      return json({ ok: true, joinUrl, role: asMod ? "moderator" : "viewer" });
    }

    // ── 종료 (강사/관리자) ───────────────────────────────────────
    if (action === "end") {
      if (!isStaff) return json({ ok: false, msg: "강사·관리자만 종료할 수 있습니다" }, 403);
      const id = (url.searchParams.get("id") || "").trim();
      const { data: room } = await svc.from("bbb_rooms").select("moderator_pw").eq("id", id).maybeSingle();
      if (room) {
        try { await fetch(await bbbApiUrl("end", { meetingID: id, password: room.moderator_pw })); } catch (_e) {}
      }
      await svc.from("bbb_rooms").update({ active: false }).eq("id", id);
      return json({ ok: true });
    }

    return json({ ok: false, msg: "알 수 없는 action: " + action }, 400);
  } catch (e) {
    return json({ ok: false, msg: "오류: " + String((e as any)?.message ?? e) }, 500);
  }
});

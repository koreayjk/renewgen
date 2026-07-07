// ═════════════════════════════════════════════════════════════════
//  Supabase Edge Function — classin-scores
//  성적표(어드민)가 클래스인 성적을 읽어오는 조회 엔드포인트.
//  scores.php 를 대체하며, 쿼리/응답 형태를 그대로 맞춥니다.
//  ──────────────────────────────────────────────────────────────
//  · GET ?action=activities[&cmd=AnswerSheetScore]
//       → 성적이 들어온 "시험(활동)" 목록 (회차 선택용)
//         { ok, activities:[{activity_id, activity_name, course_name,
//           unit_name, cmd, max_score, student_count,
//           last_corrected, last_submitted}] }
//  · GET ?action=rows&ids=63919314,63919315[&since=2026-06-01][&cmd=...]
//       → 선택한 시험들의 학생별 성적 행
//         { ok, count, rows:[...] }
//
//  배포(JWT 검증은 켠 채로 — 관리자만 호출):
//     supabase functions deploy classin-scores
//  환경변수:
//     · ADMIN_EMAILS : (선택) 고정 관리자 이메일(콤마구분). 기본 koreayjk@gmail.com
//     · SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (자동 주입)
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
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") || "koreayjk@gmail.com")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const STAFF_ROLES = ["admin", "staff", "teacher"];

const CMD_ALLOWED = ["AnswerSheetScore", "ExamScore", "HomeworkScore", "all"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // ── 인증: 로그인한 관리자/직원만 ────────────────────────────────
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
    } catch (_e) { /* 조회 실패 → 거부 */ }
  }
  if (!allowed) return json({ ok: false, msg: "권한이 없습니다(관리자 전용)" }, 403);

  // ── 파라미터 ──────────────────────────────────────────────────
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "activities";
  const cmdIn = url.searchParams.get("cmd") || "AnswerSheetScore";
  const cmd = CMD_ALLOWED.includes(cmdIn) ? cmdIn : "AnswerSheetScore";

  try {
    // ── action=activities : 시험(활동) 단위 요약 (JS 에서 집계) ─────
    if (action === "activities") {
      let q = svc.from("classin_scores")
        .select("activity_id, activity_name, course_name, unit_name, cmd, max_score, corrected_at, submitted_at")
        .limit(20000);
      if (cmd !== "all") q = q.eq("cmd", cmd);
      const { data, error } = await q;
      if (error) throw error;

      const byId = new Map<string, any>();
      for (const r of (data || [])) {
        const id = r.activity_id;
        let a = byId.get(id);
        if (!a) {
          a = {
            activity_id: id, activity_name: r.activity_name, course_name: r.course_name,
            unit_name: r.unit_name, cmd: r.cmd, max_score: r.max_score,
            student_count: 0, last_corrected: null as string | null, last_submitted: null as string | null,
          };
          byId.set(id, a);
        }
        a.student_count += 1;
        if (r.activity_name) a.activity_name = r.activity_name;
        if (r.course_name) a.course_name = r.course_name;
        if (r.unit_name) a.unit_name = r.unit_name;
        if (r.max_score != null) a.max_score = r.max_score;
        if (r.corrected_at && (!a.last_corrected || r.corrected_at > a.last_corrected)) a.last_corrected = r.corrected_at;
        if (r.submitted_at && (!a.last_submitted || r.submitted_at > a.last_submitted)) a.last_submitted = r.submitted_at;
      }
      const activities = Array.from(byId.values()).sort((x, y) => {
        const cx = x.last_corrected || "", cy = y.last_corrected || "";
        if (cx !== cy) return cx < cy ? 1 : -1;
        const sx = x.last_submitted || "", sy = y.last_submitted || "";
        return sx < sy ? 1 : (sx > sy ? -1 : 0);
      }).slice(0, 500);
      return json({ ok: true, activities });
    }

    // ── action=rows : 학생별 성적 행 ────────────────────────────────
    if (action === "rows") {
      let q = svc.from("classin_scores")
        .select("cmd, course_id, course_name, unit_id, unit_name, activity_id, activity_name, class_id, student_uid, student_name, student_account, member_id, max_score, score, scoring_rate, topic_json, submitted_at, corrected_at")
        .limit(20000);
      if (cmd !== "all") q = q.eq("cmd", cmd);

      const ids = (url.searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length) q = q.in("activity_id", ids);

      const since = (url.searchParams.get("since") || "").trim();
      if (since) q = q.or(`corrected_at.gte.${since},submitted_at.gte.${since}`);

      q = q.order("activity_id", { ascending: true }).order("score", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;

      const rows = (data || []).map((r: any) => {
        const { topic_json, ...rest } = r;
        return { ...rest, topics: topic_json ?? null };
      });
      return json({ ok: true, count: rows.length, rows });
    }

    return json({ ok: false, msg: "알 수 없는 action: " + action }, 400);
  } catch (e) {
    return json({ ok: false, msg: "서버 오류: " + String((e as any)?.message ?? e) }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════
//  Supabase Edge Function — classin-hook
//  클래스인 데이터 수신(Data Subscription) 엔드포인트.
//  ──────────────────────────────────────────────────────────────
//  클래스인 관리콘솔/본사에 "데이터 수신 주소"로 이 함수 URL 을 등록:
//     https://<프로젝트>.supabase.co/functions/v1/classin-hook
//
//  ⚠️ 배포 시 반드시 JWT 검증을 꺼야 합니다(클래스인은 Supabase JWT 를
//     보내지 못함):
//        supabase functions deploy classin-hook --no-verify-jwt
//     (대시보드 배포 시: Function 설정 → "Verify JWT" 끄기)
//
//  환경변수(Secrets):
//     · CLASSIN_HOOK_TOKEN : (선택) 약속한 검증 토큰. 설정하면 ?token= 대조.
//     · SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (자동 주입)
//
//  수신 유형(Cmd):
//     AnswerSheetScore = OMR 답안카드(자동 채점) ← 월말평가 핵심
//     ExamScore        = LMS 테스트(측험)
//     HomeworkScore    = 작업(숙제) 채점
// ═════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

// 폼(form-urlencoded) 또는 JSON body 모두 대응
async function readBody(req: Request): Promise<Record<string, any>> {
  const ct = (req.headers.get("content-type") || "").toLowerCase();
  const raw = await req.text();
  if (!raw) return {};
  if (ct.includes("application/json")) {
    try { return JSON.parse(raw); } catch { /* fallthrough */ }
  }
  // form-urlencoded
  if (ct.includes("application/x-www-form-urlencoded") || raw.includes("=")) {
    try {
      const p = new URLSearchParams(raw);
      const o: Record<string, any> = {};
      for (const [k, v] of p) {
        // 클래스인이 폼필드로 JSON 문자열을 넣는 경우까지 대응
        try { o[k] = JSON.parse(v); } catch { o[k] = v; }
      }
      // data=... 하나로 통째로 오는 경우
      if (o.data && typeof o.data === "object") return o.data;
      if (Object.keys(o).length) return o;
    } catch { /* fallthrough */ }
  }
  try { return JSON.parse(raw); } catch { return { _raw: raw }; }
}

const tsToIso = (t: unknown): string | null => {
  const n = Number(t);
  return t && Number.isFinite(n) && n > 0
    ? new Date(n * 1000).toISOString()
    : null;
};

// 성적 push 1건 → classin_scores UPSERT 용 레코드 만들기 (hook.php saveScore 이식)
function toScoreRow(cmd: string, msg: Record<string, any>) {
  const d = msg.Data ?? {};
  const stu = d.StudentInfo ?? {};
  const activityId = String(d.ActivityId ?? "");
  const uid = String(stu.StudentUid ?? "");
  if (!activityId || !uid) return null; // 식별 불가 → 건너뜀

  // 만점: AnswerSheetScore 는 MaximumScore, ExamScore/HomeworkScore 는 Score
  const max = d.MaximumScore ?? d.Score ?? null;
  const rate = d.StudentScoringRate != null ? Number(d.StudentScoringRate) : null;

  // 취득 점수: 문항별 TopicScore 합계가 가장 정확. 없으면 득점률×만점.
  let score: number | null = null;
  if (Array.isArray(d.TopicDetails) && d.TopicDetails.length) {
    let sum = 0, any = false;
    for (const t of d.TopicDetails) {
      if (t && t.TopicScore != null) { sum += Number(t.TopicScore); any = true; }
    }
    if (any) score = sum;
  }
  if (score === null && d.StudentScore != null && !isNaN(Number(d.StudentScore))) {
    score = Number(d.StudentScore);
  }
  if (score === null && rate !== null && max !== null) {
    score = Math.round(rate * Number(max) * 100) / 100;
  }

  return {
    cmd,
    sid: String(msg.SID ?? ""),
    course_id: String(msg.CourseID ?? ""),
    course_name: String(msg.CourseName ?? ""),
    unit_id: String(d.UnitId ?? ""),
    unit_name: String(d.UnitName ?? ""),
    activity_id: activityId,
    activity_name: String(d.ActivityName ?? ""),
    class_id: String(d.ClassId ?? ""),
    student_uid: uid,
    student_name: String(stu.StudentName ?? ""),
    student_account: String(stu.StudentAccount ?? ""),
    max_score: max !== null ? Number(max) : null,
    score,
    scoring_rate: rate,
    topic_json: d.TopicDetails ?? null,
    submitted_at: tsToIso(d.SubmissionTime),
    corrected_at: tsToIso(d.CorrectionTime),
    received_at: new Date().toISOString(),
  };
}

serve(async (req) => {
  // 클래스인 규칙: 어떤 경우든 빠르게 200 성공을 돌려준다.
  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let data: Record<string, any> = {};
  try {
    data = await readBody(req);
  } catch { /* 무시하고 아래에서 로그 */ }

  // (선택) 토큰 검증
  const token = Deno.env.get("CLASSIN_HOOK_TOKEN") || "";
  if (token) {
    const url = new URL(req.url);
    const got = url.searchParams.get("token") || req.headers.get("x-hook-token") || "";
    if (got !== token) return json({ ok: false, msg: "unauthorized" }, 401);
  }

  const cmd = String(data.Cmd ?? data.cmd ?? data.action ?? "unknown");

  // 1) 원본 이벤트 통째로 보관
  try {
    await svc.from("classin_events").insert({
      cmd,
      school_id: String(data.SID ?? data.schoolId ?? ""),
      course_id: String(data.CourseID ?? data.courseId ?? ""),
      class_id: String(data.ClassID ?? data.classId ?? data?.Data?.ClassId ?? ""),
      payload: data,
    });
  } catch (_e) { /* 적재 실패해도 200 은 준다 */ }

  // 2) 성적 유형이면 classin_scores 로 UPSERT
  if (["AnswerSheetScore", "ExamScore", "HomeworkScore"].includes(cmd)) {
    try {
      const row = toScoreRow(cmd, data);
      if (row) {
        // 회원 매칭: profiles.classin_uid = student_uid 면 member_id 채움
        try {
          const { data: prof } = await svc
            .from("profiles").select("id").eq("classin_uid", row.student_uid).maybeSingle();
          if (prof?.id) (row as any).member_id = prof.id;
        } catch (_e) { /* 매핑 실패해도 성적은 저장 */ }
        await svc.from("classin_scores").upsert(row, {
          onConflict: "activity_id,student_uid,cmd",
        });
      }
    } catch (_e) { /* 실패해도 200 (원본은 events 에 있음) */ }
  }

  // 3) 클래스인이 기대하는 정상 수신 응답
  return json({ errno: 1, error: "ok" });
});

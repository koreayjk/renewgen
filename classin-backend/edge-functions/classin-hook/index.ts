// ═════════════════════════════════════════════════════════════════
//  Supabase Edge Function — classin-hook
//  클래스인 데이터 수신(Data Subscription) 엔드포인트.
//  ──────────────────────────────────────────────────────────────
//  클래스인 관리콘솔/본사에 "데이터 수신 주소"로 이 함수 URL 을 등록:
//     https://<프로젝트>.supabase.co/functions/v1/classin-hook
//
//  ⚠️ 배포 시 반드시 JWT 검증을 끄세요(클래스인은 Supabase JWT 못 보냄):
//        supabase functions deploy classin-hook --no-verify-jwt
//     (대시보드: Function 설정 → "Verify JWT" 끄기)
//
//  이 함수는 들어오는 "모든 종류"의 이벤트를 처리합니다:
//     · 원본은 항상 classin_events 에 통째로 보관 (유실 0)
//     · 성적      → classin_scores
//     · 출결      → classin_attendance
//     · 보상/트로피→ classin_rewards
//     · 손들기/무대/정답/채팅 → classin_interactions
//     · 녹화파일   → classin_recordings
//     · 수업요약   → classin_class_summary
//  ※ 유형별 필드명은 버전차가 있어 "여러 후보 키"를 모두 시도합니다.
//    표에 안 들어가도 원본은 남으므로, 나중에 backfill 로 재정리 가능.
//
//  환경변수: CLASSIN_HOOK_TOKEN(선택), SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY(자동)
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
  if (ct.includes("application/x-www-form-urlencoded") || raw.includes("=")) {
    try {
      const p = new URLSearchParams(raw);
      const o: Record<string, any> = {};
      for (const [k, v] of p) {
        try { o[k] = JSON.parse(v); } catch { o[k] = v; }
      }
      if (o.data && typeof o.data === "object") return o.data;
      if (Object.keys(o).length) return o;
    } catch { /* fallthrough */ }
  }
  try { return JSON.parse(raw); } catch { return { _raw: raw }; }
}

// ── 공통 헬퍼 ──────────────────────────────────────────────────────
// 여러 후보 키 중 처음으로 값이 있는 것을 반환
function pick(obj: any, ...keys: string[]): any {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
}
// 유닉스초/밀리초/문자열 → ISO
function toIso(t: unknown): string | null {
  if (t == null || t === "") return null;
  if (typeof t === "string" && /[-:T]/.test(t)) {
    const d = new Date(t.replace(" ", "T"));
    return isNaN(+d) ? null : d.toISOString();
  }
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  // 10자리=초, 13자리=밀리초
  return new Date(n < 1e12 ? n * 1000 : n).toISOString();
}
const numOrNull = (v: unknown) => (v == null || v === "" || isNaN(Number(v)) ? null : Number(v));

// 학생 식별 정보 추출 (StudentInfo 안 또는 Data 바로 아래 모두 대응)
function ident(d: any) {
  const stu = d?.StudentInfo ?? d?.UserInfo ?? d?.Student ?? d;
  return {
    student_uid: String(pick(stu, "StudentUid", "Uid", "UID", "UserId", "StudentId") ?? "") || null,
    student_name: String(pick(stu, "StudentName", "Name", "NickName", "Nickname", "UserName") ?? "") || null,
    student_account: String(pick(stu, "StudentAccount", "Account", "Mobile", "Telephone", "Email") ?? "") || null,
  };
}
// 공통 메타(수업/코스/학교)
function meta(msg: any) {
  const d = msg?.Data ?? {};
  return {
    sid: String(pick(msg, "SID", "SchoolId", "schoolId") ?? "") || null,
    course_id: String(pick(msg, "CourseID", "CourseId", "courseId") ?? "") || null,
    course_name: String(pick(msg, "CourseName", "courseName") ?? pick(d, "CourseName") ?? "") || null,
    class_id: String(pick(msg, "ClassID", "ClassId", "classId") ?? pick(d, "ClassId", "ClassID") ?? "") || null,
  };
}

// ── 성적 (AnswerSheetScore·ExamScore·HomeworkScore) ────────────────
function toScoreRow(cmd: string, msg: Record<string, any>) {
  const d = msg.Data ?? {};
  const stu = d.StudentInfo ?? {};
  const activityId = String(d.ActivityId ?? "");
  const uid = String(stu.StudentUid ?? "");
  if (!activityId || !uid) return null;

  const max = d.MaximumScore ?? d.Score ?? null;
  const rate = d.StudentScoringRate != null ? Number(d.StudentScoringRate) : null;

  let score: number | null = null;
  if (Array.isArray(d.TopicDetails) && d.TopicDetails.length) {
    let sum = 0, any = false;
    for (const t of d.TopicDetails) {
      if (t && t.TopicScore != null) { sum += Number(t.TopicScore); any = true; }
    }
    if (any) score = sum;
  }
  if (score === null && d.StudentScore != null && !isNaN(Number(d.StudentScore))) score = Number(d.StudentScore);
  if (score === null && rate !== null && max !== null) score = Math.round(rate * Number(max) * 100) / 100;

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
    submitted_at: toIso(d.SubmissionTime),
    corrected_at: toIso(d.CorrectionTime),
    received_at: new Date().toISOString(),
  };
}

// cmd 분류 (대소문자·부분일치로 유연하게)
function classify(cmd: string): string {
  const c = cmd.toLowerCase();
  if (["answersheetscore", "examscore", "homeworkscore"].includes(c)) return "score";
  if (/(enter|join)/.test(c) && !/center/.test(c)) return "attend_enter";
  if (/(exit|leave|quit)/.test(c)) return "attend_exit";
  if (/attendance/.test(c)) return "attend_summary";
  if (/(trophy|reward|flower|medal|praise|star)/.test(c)) return "reward";
  if (/(record|replay|playback|video)/.test(c)) return "recording";
  if (/(summary|classover|classend|endclass|lessonreport|classreport)/.test(c)) return "summary";
  if (/(handsup|raise|onstage|offstage|stage|answer|selector|response|chat|message|screenshare|share)/.test(c)) return "interaction";
  return "other";
}

serve(async (req) => {
  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let data: Record<string, any> = {};
  try { data = await readBody(req); } catch { /* 무시 */ }

  // (선택) 토큰 검증
  const token = Deno.env.get("CLASSIN_HOOK_TOKEN") || "";
  if (token) {
    const url = new URL(req.url);
    const got = url.searchParams.get("token") || req.headers.get("x-hook-token") || "";
    if (got !== token) return json({ ok: false, msg: "unauthorized" }, 401);
  }

  const cmd = String(data.Cmd ?? data.cmd ?? data.action ?? "unknown");
  const d = data.Data ?? {};
  const id = ident(d);
  const m = meta(data);
  const occurred = toIso(pick(d, "Time", "Timestamp", "OccurTime", "EventTime", "CreateTime", "SubmissionTime", "CorrectionTime", "StartTime"));

  // profiles.classin_uid 로 member_id 매칭(있으면)
  let memberId: string | null = null;
  if (id.student_uid) {
    try {
      const { data: prof } = await svc.from("profiles").select("id").eq("classin_uid", id.student_uid).maybeSingle();
      if (prof?.id) memberId = prof.id;
    } catch (_e) { /* 매핑 실패해도 계속 */ }
  }

  // 1) 원본 이벤트 통째로 보관(+식별 컬럼) — 무슨 일이 있어도 여기엔 남는다
  try {
    await svc.from("classin_events").insert({
      cmd,
      school_id: m.sid ?? "",
      course_id: m.course_id ?? "",
      class_id: m.class_id ?? "",
      student_uid: id.student_uid,
      student_name: id.student_name,
      occurred_at: occurred,
      payload: data,
    });
  } catch (_e) { /* 200 은 준다 */ }

  // 2) 유형별 정규화 적재 (best-effort, 실패해도 200)
  try {
    const kind = classify(cmd);

    if (kind === "score") {
      const row = toScoreRow(cmd, data);
      if (row) {
        if (memberId) (row as any).member_id = memberId;
        await svc.from("classin_scores").upsert(row, { onConflict: "activity_id,student_uid,cmd" });
      }
    } else if (kind === "attend_enter" || kind === "attend_exit" || kind === "attend_summary") {
      const event = kind === "attend_enter" ? "enter" : kind === "attend_exit" ? "exit"
        : String(pick(d, "Status", "AttendStatus", "AttendanceStatus") ?? "present").toLowerCase();
      await svc.from("classin_attendance").insert({
        cmd, event, ...m, ...id, member_id: memberId,
        duration_sec: numOrNull(pick(d, "Duration", "OnlineDuration", "AttendDuration", "Length")),
        occurred_at: occurred, raw: data,
      });
    } else if (kind === "reward") {
      await svc.from("classin_rewards").insert({
        sid: m.sid, course_id: m.course_id, class_id: m.class_id, ...id, member_id: memberId,
        reward_type: String(pick(d, "RewardType", "Type", "TrophyType") ?? cmd),
        amount: numOrNull(pick(d, "Amount", "Count", "Number", "Num")) ?? 1,
        occurred_at: occurred, raw: data,
      });
    } else if (kind === "recording") {
      const url = String(pick(d, "Url", "URL", "VideoUrl", "PlaybackUrl", "ReplayUrl", "DownloadUrl", "FileUrl") ?? "");
      if (url) {
        await svc.from("classin_recordings").upsert({
          sid: m.sid, course_id: m.course_id, course_name: m.course_name, class_id: m.class_id,
          title: String(pick(d, "Title", "Name", "FileName") ?? m.course_name ?? ""),
          url,
          duration_sec: numOrNull(pick(d, "Duration", "Length")),
          recorded_at: occurred, raw: data,
        }, { onConflict: "class_id,url" });
      }
    } else if (kind === "summary") {
      await svc.from("classin_class_summary").upsert({
        class_id: m.class_id ?? cmd + "-" + (occurred ?? ""),
        sid: m.sid, course_id: m.course_id, course_name: m.course_name,
        started_at: toIso(pick(d, "StartTime", "BeginTime")),
        ended_at: toIso(pick(d, "EndTime", "FinishTime", "OverTime")),
        attendee_count: numOrNull(pick(d, "AttendeeCount", "StudentCount", "MemberCount")),
        summary: d, raw: data,
      }, { onConflict: "class_id" });
    } else if (kind === "interaction") {
      await svc.from("classin_interactions").insert({
        cmd, sid: m.sid, course_id: m.course_id, class_id: m.class_id, ...id, member_id: memberId,
        detail: d, occurred_at: occurred, raw: data,
      });
    }
    // kind === "other" → 원본만 보관(위 1단계). 필요 시 나중에 backfill.
  } catch (_e) { /* 실패해도 200 — 원본은 events 에 있음 */ }

  // 3) 클래스인이 기대하는 정상 수신 응답
  return json({ errno: 1, error: "ok" });
});

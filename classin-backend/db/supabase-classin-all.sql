-- ════════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — 클래스인 "모든 데이터" 저장소 (Supabase)
--  ──────────────────────────────────────────────────────────────────
--  실시간 쌍방향 수업에서 나오는 모든 종류의 데이터를 미리 담아둘 그릇.
--  classin-hook 이 원본(classin_events)과 함께 아래 표들에 정리 적재합니다.
--
--  ※ supabase-classin-scores.sql 을 먼저 실행했다는 전제로,
--    여기서는 나머지 테이블만 추가합니다. (성적 = classin_scores 는 이미 있음)
--
--  적용법: Supabase → SQL Editor → 이 파일 전체 붙여넣기 → Run
-- ════════════════════════════════════════════════════════════════════

-- classin_events 에 조회/필터용 공통 식별 컬럼 추가(이미 있으면 무시)
alter table public.classin_events add column if not exists student_uid  text;
alter table public.classin_events add column if not exists student_name text;
alter table public.classin_events add column if not exists occurred_at  timestamptz;
create index if not exists classin_events_cmd_idx        on public.classin_events (cmd);
create index if not exists classin_events_student_idx    on public.classin_events (student_uid);
create index if not exists classin_events_occurred_idx   on public.classin_events (occurred_at desc);

-- ── 출결 (입장/퇴장/출석) ───────────────────────────────────────────
create table if not exists public.classin_attendance (
  id           bigserial primary key,
  cmd          text,                    -- Enter / Exit / Attendance 등 원본 유형
  event        text,                    -- enter | exit | present | late | leave_early | absent
  sid          text,
  course_id    text,
  course_name  text,
  class_id     text,
  student_uid  text,
  student_name text,
  student_account text,
  member_id    uuid,
  duration_sec numeric,                 -- 참여(접속) 시간(초) — 있으면
  occurred_at  timestamptz,
  raw          jsonb,
  received_at  timestamptz not null default now()
);
create index if not exists classin_attendance_class_idx   on public.classin_attendance (class_id);
create index if not exists classin_attendance_student_idx on public.classin_attendance (student_uid);
create index if not exists classin_attendance_time_idx    on public.classin_attendance (occurred_at desc);

-- ── 보상/트로피 ─────────────────────────────────────────────────────
create table if not exists public.classin_rewards (
  id           bigserial primary key,
  sid          text,
  course_id    text,
  class_id     text,
  student_uid  text,
  student_name text,
  member_id    uuid,
  reward_type  text,                    -- trophy | flower | medal ...
  amount       numeric,
  occurred_at  timestamptz,
  raw          jsonb,
  received_at  timestamptz not null default now()
);
create index if not exists classin_rewards_class_idx   on public.classin_rewards (class_id);
create index if not exists classin_rewards_student_idx on public.classin_rewards (student_uid);

-- ── 상호작용(손들기/무대/정답/채팅 등) — 범용 ──────────────────────
create table if not exists public.classin_interactions (
  id           bigserial primary key,
  cmd          text,                    -- HandsUp | OnStage | Answer | Selector | Chat ...
  sid          text,
  course_id    text,
  class_id     text,
  student_uid  text,
  student_name text,
  member_id    uuid,
  detail       jsonb,                   -- 유형별 상세(정답/정오답/좌석/메시지 등)
  occurred_at  timestamptz,
  raw          jsonb,
  received_at  timestamptz not null default now()
);
create index if not exists classin_interactions_cmd_idx     on public.classin_interactions (cmd);
create index if not exists classin_interactions_class_idx   on public.classin_interactions (class_id);
create index if not exists classin_interactions_student_idx on public.classin_interactions (student_uid);

-- ── 녹화 파일(다시보기) ─────────────────────────────────────────────
create table if not exists public.classin_recordings (
  id           bigserial primary key,
  sid          text,
  course_id    text,
  course_name  text,
  class_id     text,
  title        text,
  url          text,
  duration_sec numeric,
  recorded_at  timestamptz,
  raw          jsonb,
  received_at  timestamptz not null default now(),
  unique (class_id, url)
);
create index if not exists classin_recordings_class_idx on public.classin_recordings (class_id);

-- ── 수업 요약 리포트 ────────────────────────────────────────────────
create table if not exists public.classin_class_summary (
  class_id       text primary key,
  sid            text,
  course_id      text,
  course_name    text,
  started_at     timestamptz,
  ended_at       timestamptz,
  attendee_count int,
  summary        jsonb,
  raw            jsonb,
  received_at    timestamptz not null default now()
);

-- RLS: 모두 잠그고 Edge Function(service_role)만 접근
alter table public.classin_attendance    enable row level security;
alter table public.classin_rewards       enable row level security;
alter table public.classin_interactions  enable row level security;
alter table public.classin_recordings    enable row level security;
alter table public.classin_class_summary enable row level security;

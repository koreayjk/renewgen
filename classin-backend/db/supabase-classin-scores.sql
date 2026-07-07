-- ════════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — 클래스인 성적 연동 (Supabase 버전)
--  ──────────────────────────────────────────────────────────────────
--  Cafe24 MySQL 의 classin_scores / classin_events 를 Supabase(Postgres)로
--  옮긴 스키마입니다. Edge Function 두 개가 이 테이블을 씁니다:
--    · classin-hook   → 클래스인이 push 한 성적을 여기에 UPSERT (service_role)
--    · classin-scores → 성적표(어드민)가 여기서 활동/행을 읽음 (service_role)
--
--  적용법: Supabase → SQL Editor → 이 파일 전체 붙여넣기 → Run
-- ════════════════════════════════════════════════════════════════════

-- 원본 이벤트 전체 보관 (스키마 변화에 안전 · 감사/재처리용)
create table if not exists public.classin_events (
  id          bigserial primary key,
  cmd         text,
  school_id   text,
  course_id   text,
  class_id    text,
  payload     jsonb,
  received_at timestamptz not null default now()
);

-- 시험/답안카드 성적 (정규화 적재)
create table if not exists public.classin_scores (
  cmd             text not null,
  sid             text,
  course_id       text,
  course_name     text,
  unit_id         text,
  unit_name       text,
  activity_id     text not null,
  activity_name   text,
  class_id        text,
  student_uid     text not null,
  student_name    text,
  student_account text,
  member_id       uuid,               -- profiles.id 매칭(있으면)
  max_score       numeric,
  score           numeric,
  scoring_rate    numeric,
  topic_json      jsonb,
  submitted_at    timestamptz,
  corrected_at    timestamptz,
  received_at     timestamptz not null default now(),
  -- 같은 시험을 재제출/재채점하면 같은 키로 다시 와서 최신값으로 덮어씀
  primary key (activity_id, student_uid, cmd)
);

create index if not exists classin_scores_cmd_idx        on public.classin_scores (cmd);
create index if not exists classin_scores_activity_idx   on public.classin_scores (activity_id);
create index if not exists classin_scores_corrected_idx  on public.classin_scores (corrected_at desc);
create index if not exists classin_events_received_idx   on public.classin_events (received_at desc);

-- RLS: 일반 클라이언트는 접근 불가. Edge Function 이 service_role 로만 읽고 씀.
alter table public.classin_events enable row level security;
alter table public.classin_scores enable row level security;
-- (정책을 만들지 않으면 anon/authenticated 는 모두 차단됨. service_role 은 RLS 우회.)

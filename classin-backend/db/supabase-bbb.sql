-- ════════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — v2 실시간 수업(BBB) 방 저장소
--  ──────────────────────────────────────────────────────────────────
--  Supabase → SQL Editor → 붙여넣고 RUN.
--  bbb-room Edge Function 이 이 테이블을 씁니다(service_role).
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.bbb_rooms (
  id           text primary key,                 -- 방 식별자(meetingID)
  name         text not null,                    -- 강의실 이름
  moderator_pw text not null,                     -- 강사(진행자) 비밀번호
  attendee_pw  text not null,                     -- 학생(참가자) 비밀번호
  course_id    text,                             -- (선택) 연결된 강의
  created_by   uuid,                             -- 개설한 강사(profiles.id)
  created_name text,                             -- 개설자 이름
  active       boolean not null default true,
  record       boolean not null default true,
  started_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists bbb_rooms_active_idx on public.bbb_rooms (active, created_at desc);

alter table public.bbb_rooms enable row level security;
-- Edge Function(service_role)만 접근. 프론트는 함수를 통해서만 방을 다룸.

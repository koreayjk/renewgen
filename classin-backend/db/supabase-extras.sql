-- ═════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — 부가 데이터(시험 리마인드 · AI 생성 사용량) 클라우드 저장
--   · exam_reminders : 정기고사 미응시 리마인드 발송 기록 (강사·관리자 공유)
--   · ai_usage       : 강사별 하루 AI 문제생성 횟수·예상비용 (기기 바꿔도 한도 유지)
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
--  선행 조건: db/supabase-extra.sql 의 public.is_staff() 함수가 먼저 생성돼 있어야 합니다.
-- ═════════════════════════════════════════════════════════════════

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ── 1. 시험 리마인드 ───────────────────────────────────────────────
create table if not exists public.exam_reminders (
  exam_id     text primary key,
  at          timestamptz default now(),    -- 마지막 발송 시각
  sent_by     uuid references auth.users(id),
  updated_at  timestamptz default now()
);

drop trigger if exists exam_reminders_touch on public.exam_reminders;
create trigger exam_reminders_touch before update on public.exam_reminders
  for each row execute function public.touch_updated_at();

alter table public.exam_reminders enable row level security;

-- 로그인 사용자는 읽기(학생도 '리마인드 발송됨' 표시 가능), 쓰기는 강사·관리자만
drop policy if exists "exam_reminders_read_auth" on public.exam_reminders;
create policy "exam_reminders_read_auth" on public.exam_reminders
  for select using ( auth.uid() is not null );
drop policy if exists "exam_reminders_staff_write" on public.exam_reminders;
create policy "exam_reminders_staff_write" on public.exam_reminders
  for all using ( public.is_staff() ) with check ( public.is_staff() );

-- ── 2. AI 생성 사용량 (강사별·날짜별) ──────────────────────────────
create table if not exists public.ai_usage (
  user_id     uuid not null references auth.users(id) on delete cascade,
  day         date not null,                 -- YYYY-MM-DD (KST 기준 클라이언트가 결정)
  count       int  not null default 0,        -- 그날 '출제' 클릭 횟수 (하루 한도 판정)
  krw         numeric not null default 0,     -- 그날 누적 예상 비용(원)
  updated_at  timestamptz default now(),
  primary key (user_id, day)
);

drop trigger if exists ai_usage_touch on public.ai_usage;
create trigger ai_usage_touch before update on public.ai_usage
  for each row execute function public.touch_updated_at();

alter table public.ai_usage enable row level security;

-- 본인 사용량만 읽기/쓰기 (강사·관리자는 전체 조회 — 비용 모니터링)
drop policy if exists "ai_usage_own_all" on public.ai_usage;
create policy "ai_usage_own_all" on public.ai_usage
  for all using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );
drop policy if exists "ai_usage_staff_read" on public.ai_usage;
create policy "ai_usage_staff_read" on public.ai_usage
  for select using ( public.is_staff() );

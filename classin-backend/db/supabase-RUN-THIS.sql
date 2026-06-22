-- ═════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — 남은 localStorage→Supabase 이관 (이 파일 하나만 RUN)
--   생성 테이블: admin_students · site_store · exam_reminders · ai_usage
--   선행: public.is_staff() 함수 (이미 존재 확인됨)
--   안전: 여러 번 실행해도 OK (if not exists / drop if exists)
-- ═════════════════════════════════════════════════════════════════

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ── 1. 학생 명부 오버라이드 (관리자 편집: 상태/반/수강권 등) ─────────
create table if not exists public.admin_students (
  uid         text primary key,
  email       text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz default now()
);
create index if not exists admin_students_email_idx on public.admin_students (lower(email));
drop trigger if exists admin_students_touch on public.admin_students;
create trigger admin_students_touch before update on public.admin_students
  for each row execute function public.touch_updated_at();
alter table public.admin_students enable row level security;
drop policy if exists "admin_students_staff_all" on public.admin_students;
create policy "admin_students_staff_all" on public.admin_students
  for all using ( public.is_staff() ) with check ( public.is_staff() );
drop policy if exists "admin_students_self_read" on public.admin_students;
create policy "admin_students_self_read" on public.admin_students
  for select using ( email is not null and lower(email) = lower(auth.jwt() ->> 'email') );

-- ── 2. 사이트 전역 저장소 (강좌 커스텀 · 추가 강사) ────────────────
create table if not exists public.site_store (
  key         text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz default now()
);
drop trigger if exists site_store_touch on public.site_store;
create trigger site_store_touch before update on public.site_store
  for each row execute function public.touch_updated_at();
alter table public.site_store enable row level security;
drop policy if exists "site_store_public_read" on public.site_store;
create policy "site_store_public_read" on public.site_store
  for select using ( true );
drop policy if exists "site_store_staff_write" on public.site_store;
create policy "site_store_staff_write" on public.site_store
  for all using ( public.is_staff() ) with check ( public.is_staff() );

-- ── 3. 시험 리마인드 ───────────────────────────────────────────────
create table if not exists public.exam_reminders (
  exam_id     text primary key,
  at          timestamptz default now(),
  sent_by     uuid references auth.users(id),
  updated_at  timestamptz default now()
);
drop trigger if exists exam_reminders_touch on public.exam_reminders;
create trigger exam_reminders_touch before update on public.exam_reminders
  for each row execute function public.touch_updated_at();
alter table public.exam_reminders enable row level security;
drop policy if exists "exam_reminders_read_auth" on public.exam_reminders;
create policy "exam_reminders_read_auth" on public.exam_reminders
  for select using ( auth.uid() is not null );
drop policy if exists "exam_reminders_staff_write" on public.exam_reminders;
create policy "exam_reminders_staff_write" on public.exam_reminders
  for all using ( public.is_staff() ) with check ( public.is_staff() );

-- ── 4. AI 생성 사용량 (강사별·날짜별) ──────────────────────────────
create table if not exists public.ai_usage (
  user_id     uuid not null references auth.users(id) on delete cascade,
  day         date not null,
  count       int  not null default 0,
  krw         numeric not null default 0,
  updated_at  timestamptz default now(),
  primary key (user_id, day)
);
drop trigger if exists ai_usage_touch on public.ai_usage;
create trigger ai_usage_touch before update on public.ai_usage
  for each row execute function public.touch_updated_at();
alter table public.ai_usage enable row level security;
drop policy if exists "ai_usage_own_all" on public.ai_usage;
create policy "ai_usage_own_all" on public.ai_usage
  for all using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );
drop policy if exists "ai_usage_staff_read" on public.ai_usage;
create policy "ai_usage_staff_read" on public.ai_usage
  for select using ( public.is_staff() );

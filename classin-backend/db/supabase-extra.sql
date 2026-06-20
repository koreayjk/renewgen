-- ══════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — Supabase 보완 스키마 (구독 + 역할/권한 정책)
--  ──────────────────────────────────────────────────────────────────
--  실행 순서:  1) db/supabase-schema.sql   2) supabase-exam-schema.sql
--             3) 이 파일(db/supabase-extra.sql)
--  Supabase 대시보드 → SQL Editor → 붙여넣고 RUN
-- ══════════════════════════════════════════════════════════════════

-- ── 1. 구독 (월정액) ─────────────────────────────────────────────
--  access.jsx 가 이 테이블을 조회해 "구독자 = 모든 녹화본 무료" 를 판정합니다.
create table if not exists public.subscriptions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'active',   -- active | canceled | expired
  plan        text,                             -- 'monthly' | 'yearly' 등
  order_no    text,                             -- 결제 주문번호(토스 등)
  amount      int  not null default 0,
  started_at  timestamptz not null default now(),
  expires_at  timestamptz,                       -- null = 무기한
  unique (user_id)
);

alter table public.subscriptions enable row level security;

-- 본인 구독만 조회 (INSERT/갱신은 결제검증 후 Edge Function(service_role) 권장)
drop policy if exists "subs_select_own" on public.subscriptions;
create policy "subs_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ── 2. 역할 판정 헬퍼 (RLS 재귀 방지: security definer) ───────────
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('teacher','admin')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ── 3. 강사/관리자 권한 정책 ─────────────────────────────────────

-- (a) 프로필: 강사·관리자는 전체 학생 조회, 관리자는 역할 변경(등업) 가능
drop policy if exists "profiles_staff_read" on public.profiles;
create policy "profiles_staff_read" on public.profiles
  for select using ( public.is_staff() );
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using ( public.is_admin() );

-- (b) 시험: 출제/수정은 강사·관리자만 (기존 '아무 로그인' 정책을 교체)
drop policy if exists "exams write" on public.exams;
drop policy if exists "exams_staff_write" on public.exams;
create policy "exams_staff_write" on public.exams
  for all using ( public.is_staff() ) with check ( public.is_staff() );

-- (c) 응시기록: 강사·관리자는 전체 조회 + 채점(수정) 가능
drop policy if exists "attempts_staff_read" on public.exam_attempts;
create policy "attempts_staff_read" on public.exam_attempts
  for select using ( public.is_staff() );
drop policy if exists "attempts_staff_grade" on public.exam_attempts;
create policy "attempts_staff_grade" on public.exam_attempts
  for update using ( public.is_staff() );

-- (d) 수강등록: 강사·관리자는 전체 조회 (관리/통계용)
drop policy if exists "enrollments_staff_read" on public.enrollments;
create policy "enrollments_staff_read" on public.enrollments
  for select using ( public.is_staff() );

-- ── 4. Storage (시험지 PDF) 정책 ─────────────────────────────────
--  버킷 'exam-pdfs' 는 대시보드에서 이미 생성됨.
--  · 공개 버킷으로 두면 아래 정책 없이도 누구나 URL 로 열람 가능(가장 간단).
--  · 비공개로 두려면 아래 정책으로 "로그인 사용자 읽기 / 강사 업로드" 를 허용하세요.
drop policy if exists "exam_pdf_read" on storage.objects;
create policy "exam_pdf_read" on storage.objects
  for select using ( bucket_id = 'exam-pdfs' and auth.role() = 'authenticated' );
drop policy if exists "exam_pdf_write" on storage.objects;
create policy "exam_pdf_write" on storage.objects
  for insert with check ( bucket_id = 'exam-pdfs' and public.is_staff() );

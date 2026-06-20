-- ============================================================
--  리뉴젠 아카데미 · 시험 시스템 Supabase 스키마
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
--  (실행 후 사이트에서 시험 출제/응시 시 자동으로 이 테이블에 저장됩니다)
-- ============================================================

-- 1) 시험(문제·정답표) ----------------------------------------
create table if not exists public.exams (
  id          text primary key,           -- 앱에서 생성한 시험 id
  data        jsonb not null,             -- 시험 전체(문항/정답/PDF 등) JSON
  created_by  uuid references auth.users(id),
  updated_at  timestamptz default now()
);

-- 2) 응시 기록(학생별 1행) -------------------------------------
create table if not exists public.exam_attempts (
  exam_id      text not null,
  user_id      uuid not null references auth.users(id),
  data         jsonb not null,            -- 답안·자동채점·수동채점 등 JSON
  score        int  default 0,            -- 최종 점수(정렬·통계용)
  graded       bool default false,
  submitted_at timestamptz default now(),
  primary key (exam_id, user_id)
);

create index if not exists exam_attempts_exam_idx on public.exam_attempts (exam_id);

-- 3) RLS (행 수준 보안) ---------------------------------------
alter table public.exams          enable row level security;
alter table public.exam_attempts  enable row level security;

-- 시험: 로그인 사용자는 모두 읽기, 로그인 사용자는 출제/수정 가능
--   (운영 시에는 profiles.role = 'teacher'/'admin' 으로 쓰기 제한 권장)
drop policy if exists "exams read"  on public.exams;
drop policy if exists "exams write" on public.exams;
create policy "exams read"  on public.exams for select using ( auth.role() = 'authenticated' );
create policy "exams write" on public.exams for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

-- 응시: 학생은 본인 기록만 읽기/쓰기
--   (강사 채점을 서버에서 하려면 service_role Edge Function 또는
--    profiles.role 기반 정책을 추가하세요)
drop policy if exists "attempts owner" on public.exam_attempts;
create policy "attempts owner" on public.exam_attempts for all
  using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );

-- (선택) 강사/관리자가 모든 응시본을 읽고 채점하도록 하려면,
-- profiles(id uuid, role text) 테이블이 있다고 가정하고 아래 정책을 추가:
--
-- create policy "attempts staff read" on public.exam_attempts for select
--   using ( exists (select 1 from public.profiles p
--                   where p.id = auth.uid() and p.role in ('teacher','admin')) );
-- create policy "attempts staff grade" on public.exam_attempts for update
--   using ( exists (select 1 from public.profiles p
--                   where p.id = auth.uid() and p.role in ('teacher','admin')) );

-- ══════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — Supabase 전체 설치 (이 파일 하나만 실행하면 됩니다)
--  ──────────────────────────────────────────────────────────────────
--  Supabase 대시보드 → SQL Editor → New query → 아래 전체 붙여넣고 RUN
--  (이미 일부를 실행했어도 안전하게 다시 실행 가능 — if not exists / drop if exists)
--  실행 후: profiles 에서 본인 계정 role 을 'admin' 으로 변경하세요.
-- ══════════════════════════════════════════════════════════════════




-- ====================================================================
-- 1/3 · 회원 · 강의 · 수강 · 시청기록
-- ====================================================================

-- ══════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — Supabase 데이터베이스 스키마
--  ──────────────────────────────────────────────────────────────────
--  실행 방법:
--   1) Supabase 대시보드 접속 (https://supabase.com/dashboard)
--   2) 왼쪽 메뉴 → SQL Editor → New query
--   3) 이 파일 내용을 통째로 붙여넣고 RUN
--  ──────────────────────────────────────────────────────────────────
--  RLS(Row Level Security): "내 데이터는 나만" 보호. 켜두는 게 안전합니다.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. 프로필 (회원 정보) ─────────────────────────────────────────
-- auth.users(Supabase 기본 계정 테이블)와 1:1로 연결됩니다.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  name       text,
  grade      text,
  school     text,
  subject    text,
  role       text not null default 'student',   -- student | teacher | admin
  classin_uid text,                             -- 클래스인 사용자 UID (연동용)
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 본인 프로필만 읽기/수정/생성
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- 회원가입 시 프로필 자동 생성 (트리거)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, grade, school, subject)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'grade',
    new.raw_user_meta_data->>'school',
    new.raw_user_meta_data->>'subject'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. 강의 (코스) ───────────────────────────────────────────────
create table if not exists public.courses (
  id            text primary key,               -- 예: 'math-calc-2026'
  title         text not null,
  instructor    text,
  subject       text,
  level         text,
  price         int  not null default 0,        -- 판매가(원), 0 = 무료
  is_free       boolean not null default false,  -- 1주차 무료 공개 등
  thumbnail     text,
  -- 영상/연동 식별자
  youtube_id    text,                           -- 유튜브 '비공개' 영상 ID (VOD)
  vimeo_id      text,                           -- 또는 Vimeo ID
  classin_course_id text,                       -- 클래스인 courseId (라이브)
  classin_room_id   text,                       -- 클래스인 classId(회차)
  created_at    timestamptz not null default now()
);

alter table public.courses enable row level security;

-- 강의 목록은 누구나 볼 수 있음 (소개/카탈로그용)
create policy "courses_public_read" on public.courses
  for select using (true);

-- ── 3. 수강 등록 (결제 후 자동 등록) ─────────────────────────────
create table if not exists public.enrollments (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  course_id  text not null references public.courses(id) on delete cascade,
  status     text not null default 'active',    -- active | expired | refunded
  order_no   text,                              -- 토스페이먼츠 주문번호
  amount     int  not null default 0,
  enrolled_at timestamptz not null default now(),
  expires_at timestamptz,                        -- null = 무기한
  unique (user_id, course_id)
);

alter table public.enrollments enable row level security;

-- 본인 수강내역만 조회
create policy "enrollments_select_own" on public.enrollments
  for select using (auth.uid() = user_id);
-- (등록 INSERT는 결제 검증 후 서버(Edge Function)에서 service_role 키로 처리 권장)

-- ── 4. 시청 기록 (이어보기) ──────────────────────────────────────
create table if not exists public.watch_progress (
  user_id    uuid not null references auth.users(id) on delete cascade,
  course_id  text not null references public.courses(id) on delete cascade,
  lesson_id  text not null,
  position_sec int not null default 0,
  progress_pct int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id, lesson_id)
);

alter table public.watch_progress enable row level security;
create policy "watch_own_all" on public.watch_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 5. 샘플 강의 데이터 (선택) ───────────────────────────────────
insert into public.courses (id, title, instructor, subject, price, is_free, youtube_id, classin_course_id)
values
  ('math-calc-2026',     '2026 미적분 정수',     '김지원', 'math',    240000, true,  'dQw4w9WgXcQ', '444451'),
  ('korean-lit-2026',    '문학·독서 정도',       '박세라', 'korean',  220000, false, null,          '444452'),
  ('english-struct-2026','구문독해 RE:BUILD',    '이현우', 'english', 220000, false, null,          '444453')
on conflict (id) do nothing;


-- ====================================================================
-- 2/3 · 시험 · 응시기록
-- ====================================================================

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


-- ====================================================================
-- 3/3 · 구독 · 강사/관리자 권한 · Storage 정책
-- ====================================================================

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

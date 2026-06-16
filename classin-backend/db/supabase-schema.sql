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

-- ══════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — 새 Supabase 프로젝트 전체 설치 (이 파일 하나만 RUN)
--  ──────────────────────────────────────────────────────────────────
--  Supabase → SQL Editor → New query → 이 파일 전체 붙여넣고 RUN.
--  모두 idempotent(여러 번 실행해도 안전). 실행 후 profiles 에서
--  본인 계정 role 을 'admin' 으로 바꾸세요.
--  포함: 기본(회원·강의·수강·시험) + 프로필보강 + 클래스인매핑 + 성적표
--       + 과제 + 결제 + 관리자저장소 + 클래스인 성적/전체 데이터
-- ══════════════════════════════════════════════════════════════════


-- ▼▼▼▼▼▼▼▼▼▼ supabase-ALL.sql ▼▼▼▼▼▼▼▼▼▼

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


-- ▼▼▼▼▼▼▼▼▼▼ supabase-profile-fields.sql ▼▼▼▼▼▼▼▼▼▼

-- ══════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — profiles 보강 (나이 · 휴대폰)
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 RUN
--  (회원가입 시 나이/휴대폰을 저장하기 위한 컬럼 추가)
-- ══════════════════════════════════════════════════════════════════

alter table public.profiles add column if not exists age    int;
alter table public.profiles add column if not exists phone  text;
alter table public.profiles add column if not exists gender text;   -- 'male' | 'female' | '' (선택 안 함)

-- 가입 트리거가 나이/휴대폰도 함께 저장하도록 갱신
-- (role 은 보안상 항상 'student' 로 생성 — 선생님 승급은 관리자가 콘솔에서 처리)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, grade, school, subject, age, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'grade',
    new.raw_user_meta_data->>'school',
    new.raw_user_meta_data->>'subject',
    nullif(new.raw_user_meta_data->>'age','')::int,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end; $$;


-- ▼▼▼▼▼▼▼▼▼▼ supabase-classin-link.sql ▼▼▼▼▼▼▼▼▼▼

-- ═════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — 클래스인 계정 매핑(자동 가입)
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
--  · profiles 테이블에 클래스인 UID 컬럼 추가
--  · Edge Function (classin-sync) 가 가입 직후 이 칼럼에 UID를 저장합니다
-- ═════════════════════════════════════════════════════════════════

alter table public.profiles add column if not exists classin_uid      text;
alter table public.profiles add column if not exists classin_role     text;        -- 'student' | 'teacher'
alter table public.profiles add column if not exists classin_linked_at timestamptz;

create index if not exists profiles_classin_uid_idx on public.profiles(classin_uid);

-- 본인 프로필은 본인이 읽기/수정 — 이미 있으면 무시됨
-- (Edge Function 은 service_role 로 RLS 우회)


-- ▼▼▼▼▼▼▼▼▼▼ supabase-reports.sql ▼▼▼▼▼▼▼▼▼▼

-- ═════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — 월말평가 성적표 클라우드 저장
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
--  (회차/학생/과목 점수 + 담임 총평이 여기 저장되어, 어느 컴퓨터·브라우저에서
--   관리자로 로그인해도 같은 데이터가 보입니다.)
--  선행 조건: supabase-extra.sql 의 public.is_staff() 함수가 이미 생성돼 있어야 합니다.
-- ═════════════════════════════════════════════════════════════════

-- ── 1. 회차 테이블 ─────────────────────────────────────────────────
-- 한 회차의 모든 학생·과목·점수를 jsonb 한 칸에 담습니다 (read/write 원자성).
create table if not exists public.report_rounds (
  id          text primary key,                  -- 예: 'r-abc123' / 'demo-0'
  label       text not null,                     -- 예: '2026 · 6월 월말평가'
  seq         bigint not null default 0,         -- 정렬용 (createdAt epoch ms)
  source      text,                              -- 'classin' | 'csv' | null
  demo        boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  data        jsonb not null                     -- { students:{...}, subjectsByLevel:{...} }
);
create index if not exists report_rounds_seq_idx on public.report_rounds(seq desc);

-- ── 2. 담임 총평 테이블 ───────────────────────────────────────────
create table if not exists public.report_comments (
  round_id      text not null references public.report_rounds(id) on delete cascade,
  student_key   text not null,                   -- 'name|org' 형식
  comment       text not null,
  updated_at    timestamptz default now(),
  primary key (round_id, student_key)
);
create index if not exists report_comments_round_idx on public.report_comments(round_id);

-- ── 3. updated_at 자동 갱신 트리거 ────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists report_rounds_touch on public.report_rounds;
create trigger report_rounds_touch before update on public.report_rounds
  for each row execute function public.touch_updated_at();
drop trigger if exists report_comments_touch on public.report_comments;
create trigger report_comments_touch before update on public.report_comments
  for each row execute function public.touch_updated_at();

-- ── 4. RLS (Row-Level Security) ──────────────────────────────────
alter table public.report_rounds   enable row level security;
alter table public.report_comments enable row level security;

-- (a) 로그인한 모든 사용자: 읽기 가능 (학생도 자기 성적 보려면 필요)
--     ※ 학생이 자기 행만 보도록 필터링은 클라이언트(ReportSelfView)에서 합니다.
drop policy if exists "report_rounds_read_auth"   on public.report_rounds;
create policy "report_rounds_read_auth" on public.report_rounds
  for select using ( auth.uid() is not null );
drop policy if exists "report_comments_read_auth" on public.report_comments;
create policy "report_comments_read_auth" on public.report_comments
  for select using ( auth.uid() is not null );

-- (b) 강사·관리자(staff): 쓰기·수정·삭제 가능
drop policy if exists "report_rounds_staff_write"   on public.report_rounds;
create policy "report_rounds_staff_write" on public.report_rounds
  for all using ( public.is_staff() ) with check ( public.is_staff() );
drop policy if exists "report_comments_staff_write" on public.report_comments;
create policy "report_comments_staff_write" on public.report_comments
  for all using ( public.is_staff() ) with check ( public.is_staff() );


-- ▼▼▼▼▼▼▼▼▼▼ supabase-assignments.sql ▼▼▼▼▼▼▼▼▼▼

-- ═════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — 반별 과제·숙제 클라우드 저장
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
--  (강사가 낸 과제/시험과 학생별 제출·채점 상태가 여기 저장되어,
--   어느 컴퓨터·브라우저에서 강사로 로그인해도 같은 데이터가 보입니다.)
--  선행 조건: db/supabase-extra.sql 의 public.is_staff() 함수가 먼저 생성돼 있어야 합니다.
-- ═════════════════════════════════════════════════════════════════

-- ── 1. 과제 테이블 ─────────────────────────────────────────────────
-- 한 과제의 모든 학생 제출/채점 상태를 jsonb 한 칸(data.submissions)에 담습니다.
create table if not exists public.class_assignments (
  id          text primary key,                  -- 앱에서 생성한 과제 id (예: 'asg-xxxx')
  class_id    text not null,                     -- 반(class) id
  type        text not null default 'homework',  -- homework | exam
  title       text not null,
  detail      text,
  due         text,                              -- 마감(표시용 문자열)
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  data        jsonb not null default '{}'::jsonb -- { submissions: { [studentId]: { status, score, comment } } }
);
create index if not exists class_assignments_class_idx on public.class_assignments(class_id);

-- ── 2. updated_at 자동 갱신 트리거 ────────────────────────────────
--   (touch_updated_at() 함수는 supabase-reports.sql 에서 이미 생성됨 — 없으면 아래가 생성)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists class_assignments_touch on public.class_assignments;
create trigger class_assignments_touch before update on public.class_assignments
  for each row execute function public.touch_updated_at();

-- ── 3. RLS (Row-Level Security) ──────────────────────────────────
alter table public.class_assignments enable row level security;

-- (a) 로그인한 모든 사용자: 읽기 가능 (학생이 자기 과제를 보려면 필요)
drop policy if exists "class_assignments_read_auth" on public.class_assignments;
create policy "class_assignments_read_auth" on public.class_assignments
  for select using ( auth.uid() is not null );

-- (b) 강사·관리자(staff): 쓰기·수정·삭제 가능
drop policy if exists "class_assignments_staff_write" on public.class_assignments;
create policy "class_assignments_staff_write" on public.class_assignments
  for all using ( public.is_staff() ) with check ( public.is_staff() );


-- ▼▼▼▼▼▼▼▼▼▼ supabase-orders.sql ▼▼▼▼▼▼▼▼▼▼

-- ═════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — 결제(토스페이먼츠) 테이블
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
--  선행: supabase-extra.sql 의 is_staff() 함수가 이미 있어야 합니다.
-- ═════════════════════════════════════════════════════════════════

-- ── 1. 주문(orders) ──────────────────────────────────────────────
-- 결제창 열기 전에 미리 INSERT하고, 승인 후 status = 'paid' 로 갱신
create table if not exists public.orders (
  order_id      text primary key,            -- 토스 orderId (RJ_xxxxxxxxx)
  user_id       uuid references auth.users(id) on delete set null,
  user_email    text,
  user_name     text,
  course_ids    text[] not null default '{}',-- 한 주문에 여러 강좌 가능
  amount        int not null,                -- 원
  status        text not null default 'pending',  -- pending | paid | failed | canceled
  payment_key   text,
  method        text,
  approved_at   timestamptz,
  raw           jsonb,                        -- 토스 승인 응답 그대로 보관(영수증 등)
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists orders_user_idx   on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);

-- ── 2. 트리거: updated_at ────────────────────────────────────────
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ── 3. RLS ──────────────────────────────────────────────────────
alter table public.orders enable row level security;

-- 본인 주문 조회
drop policy if exists "orders_own" on public.orders;
create policy "orders_own" on public.orders for select
  using ( auth.uid() = user_id );

-- 결제창 열기 직전 본인 주문 INSERT (status='pending'만)
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders for insert
  with check ( auth.uid() = user_id and status = 'pending' );

-- 스태프: 전체 조회/수정 (환불 등)
drop policy if exists "orders_staff" on public.orders;
create policy "orders_staff" on public.orders for all
  using ( public.is_staff() ) with check ( public.is_staff() );

-- (UPDATE/INSERT 정식 처리는 Edge Function 의 service_role 키가 RLS를 우회해 수행합니다)

-- ── 4. enrollments 보완 ────────────────────────────────────────
-- 결제 자동 등록을 위해 order_id 컬럼 + 본인 조회 정책 보장
alter table public.enrollments add column if not exists order_id text;
create index if not exists enrollments_order_idx on public.enrollments(order_id);


-- ▼▼▼▼▼▼▼▼▼▼ supabase-RUN-THIS.sql ▼▼▼▼▼▼▼▼▼▼

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


-- ▼▼▼▼▼▼▼▼▼▼ supabase-classin-scores.sql ▼▼▼▼▼▼▼▼▼▼

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


-- ▼▼▼▼▼▼▼▼▼▼ supabase-classin-all.sql ▼▼▼▼▼▼▼▼▼▼

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


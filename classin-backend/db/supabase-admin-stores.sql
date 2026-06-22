-- ═════════════════════════════════════════════════════════════════
--  리뉴젠 아카데미 — 관리자 로컬 저장소 → 클라우드 이관
--   · admin_students : 관리자가 편집한 학생 명부 오버라이드(상태·반·수강권 등)
--   · site_store     : 강좌 커스텀(영상/판매설정/개설) + 추가 강사 (사이트 전역 카탈로그)
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
--  선행 조건: db/supabase-extra.sql 의 public.is_staff() / public.is_admin() 함수가 먼저 생성돼 있어야 합니다.
-- ═════════════════════════════════════════════════════════════════

-- updated_at 자동 갱신 함수 (다른 파일에서 이미 생성됐으면 그대로 재정의)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ── 1. 학생 명부 오버라이드 ────────────────────────────────────────
--   uid 1개 = 학생 1명. data 에 관리자가 바꾼 값(상태/반/수강권/메모 등)을 담습니다.
--   email 컬럼은 "학생 본인이 자기 행만 읽기"(접근권 판정용) RLS 에 사용됩니다.
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

-- (a) 강사·관리자(staff): 전체 읽기/쓰기/삭제
drop policy if exists "admin_students_staff_all" on public.admin_students;
create policy "admin_students_staff_all" on public.admin_students
  for all using ( public.is_staff() ) with check ( public.is_staff() );

-- (b) 학생 본인: 자기 이메일과 일치하는 행만 읽기 (다른 학생 정보는 못 봄)
--     access.jsx 의 수강권 판정(rosterGrant)이 본인 행을 읽을 수 있게 하기 위함.
drop policy if exists "admin_students_self_read" on public.admin_students;
create policy "admin_students_self_read" on public.admin_students
  for select using ( email is not null and lower(email) = lower(auth.jwt() ->> 'email') );

-- ── 2. 사이트 전역 저장소 (강좌 커스텀 · 추가 강사) ────────────────
--   key 1개 = 블롭 1개. 카탈로그라 누구나 읽기, 쓰기는 강사·관리자만.
--     · key='courses'     → { overrides:{...}, custom:[...] }
--     · key='instructors' → [ {id,name,...}, ... ]
create table if not exists public.site_store (
  key         text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz default now()
);

drop trigger if exists site_store_touch on public.site_store;
create trigger site_store_touch before update on public.site_store
  for each row execute function public.touch_updated_at();

alter table public.site_store enable row level security;

-- (a) 누구나 읽기 (강의/강사 카탈로그는 공개 정보)
drop policy if exists "site_store_public_read" on public.site_store;
create policy "site_store_public_read" on public.site_store
  for select using ( true );

-- (b) 강사·관리자(staff)만 쓰기/수정
drop policy if exists "site_store_staff_write" on public.site_store;
create policy "site_store_staff_write" on public.site_store
  for all using ( public.is_staff() ) with check ( public.is_staff() );

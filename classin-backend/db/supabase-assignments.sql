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

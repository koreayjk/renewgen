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

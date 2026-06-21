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

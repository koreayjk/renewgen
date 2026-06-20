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

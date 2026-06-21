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

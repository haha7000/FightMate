-- 관장 입점 신청 (2026-10-09)
-- 관장님이 직접 "우리 체육관도 올려주세요"를 보내는 창구. 운영자가 전화로 확인한 뒤 체육관 등록 + 초대 링크를 보낸다.
-- (권한은 여기서 생기지 않는다 — 관장 권한은 지금처럼 운영자 초대 링크로만)
-- 여러 번 실행해도 안전.

create table if not exists partner_applications (
  id uuid primary key default gen_random_uuid(),
  gym_name text not null check (char_length(gym_name) between 1 and 60),
  address text not null default '' check (char_length(address) <= 120),
  owner_name text not null check (char_length(owner_name) between 1 and 30),
  phone text not null check (char_length(phone) between 8 and 20),
  message text not null default '' check (char_length(message) <= 500),
  user_id uuid references auth.users(id) on delete set null, -- 로그인한 상태로 보냈으면 기록
  status text not null default '새 신청' check (status in ('새 신청', '처리 완료')),
  created_at timestamptz not null default now()
);

alter table partner_applications enable row level security;

-- 누구나 보낼 수 있다 (로그인 없이). 상태는 '새 신청'으로만, 남의 회원 ID로는 못 보낸다.
drop policy if exists "partner_applications_insert" on partner_applications;
create policy "partner_applications_insert" on partner_applications for insert
  with check (status = '새 신청' and (user_id is null or user_id = auth.uid()));

-- 보기·처리는 운영자만
drop policy if exists "partner_applications_admin_read" on partner_applications;
create policy "partner_applications_admin_read" on partner_applications for select using (is_admin());
drop policy if exists "partner_applications_admin_update" on partner_applications;
create policy "partner_applications_admin_update" on partner_applications for update
  using (is_admin()) with check (is_admin());

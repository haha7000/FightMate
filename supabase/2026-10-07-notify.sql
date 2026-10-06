-- 관장님 새 신청 알림 (2026-10-07)
-- SQL Editor에서 실행. 여러 번 실행해도 안전. (2026-10-05-roles.sql 다음에 실행)
--
-- 알림 받을 번호는 gyms(누구나 조회)가 아니라 별도 테이블에 둔다 — 관장님 개인 번호 보호.

create table if not exists gym_notify (
  gym_id     text primary key references gyms(id) on delete cascade,
  phone      text not null,              -- 숫자만 (예: 01012345678)
  enabled    boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table gym_notify enable row level security;

-- 그 체육관 관장·운영자만 조회·등록·수정·삭제
drop policy if exists "gym_notify_member" on gym_notify;
create policy "gym_notify_member" on gym_notify for all
  using (is_gym_member(gym_id) or is_admin())
  with check (is_gym_member(gym_id) or is_admin());

-- 방금 신청한 손님이 "자기 신청"에 대해서만 알림 받을 번호를 얻는다.
-- (손님은 RLS상 관장 번호를 볼 수 없으므로 security definer로 좁게 열어준다)
--  · 본인 신청이어야 하고 · 신청 후 10분 이내일 때만 → 번호 수집 용도로 악용 불가
create or replace function public.booking_notify_targets(bid uuid)
returns table (phone text, gym_id text, gym_name text, applicant text, visit_date date, kind text)
language sql stable security definer set search_path = public as $$
  select n.phone, g.id, g.name, b.name, b.date, b.type
  from bookings b
  join gyms g on g.id = b.gym_id
  join gym_notify n on n.gym_id = b.gym_id and n.enabled
  where b.id = bid
    and b.user_id = auth.uid()
    and b.created_at > now() - interval '10 minutes';
$$;

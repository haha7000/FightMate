-- 역할 3단계: 회원 / 관장 / 운영자 (2026-10-05)
-- Supabase 대시보드 → SQL Editor에 붙여넣고 실행. 여러 번 실행해도 안전.
--
--   회원   : 로그인한 모든 사람 (기본)
--   관장   : gym_members 에 연결된 사람. 한 체육관에 여러 명(관장·코치) 가능
--   운영자 : admins 에 등록된 사람. SQL로만 지정 (앱에서 셀프 등록 불가)
--
-- 관장 연결은 운영자가 만든 초대 링크(gym_invites)로만 이뤄진다.

-- ──────────────────────────────────────────────
-- 1. 테이블
-- ──────────────────────────────────────────────
create table if not exists admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists gym_members (
  gym_id     text not null references gyms(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'owner' check (role in ('owner', 'coach')),
  created_at timestamptz not null default now(),
  primary key (gym_id, user_id)
);
create index if not exists gym_members_user_idx on gym_members (user_id);

create table if not exists gym_invites (
  token      text primary key default replace(gen_random_uuid()::text, '-', ''),
  gym_id     text not null references gyms(id) on delete cascade,
  role       text not null default 'owner' check (role in ('owner', 'coach')),
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default now() + interval '14 days',
  used_by    uuid references auth.users(id) on delete set null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

-- 기존 owner_id(관장 1명) → gym_members 로 옮김. owner_id 컬럼은 더 이상 권한에 쓰지 않음.
insert into gym_members (gym_id, user_id, role)
select id, owner_id, 'owner' from gyms where owner_id is not null
on conflict do nothing;

-- 예약 상태·종류 값 제한 (거절 추가)
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status in ('신청됨', '확정', '거절', '사용 완료'));
alter table bookings drop constraint if exists bookings_type_check;
alter table bookings add constraint bookings_type_check check (type in ('체험', '1일권'));

-- ──────────────────────────────────────────────
-- 2. 권한 확인 함수 (security definer: 정책 안에서 다른 테이블을 안전하게 조회)
-- ──────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

create or replace function public.is_gym_member(gid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from gym_members where gym_id = gid and user_id = auth.uid());
$$;

-- 초대 링크 미리보기 (로그인 전에도 어느 체육관 초대인지 보여주기 위함. 토큰을 아는 사람만)
create or replace function public.peek_gym_invite(invite_token text)
returns table (gym_id text, gym_name text, role text, expired boolean, used boolean)
language sql stable security definer set search_path = public as $$
  select i.gym_id, g.name, i.role, i.expires_at < now(), i.used_at is not null
  from gym_invites i join gyms g on g.id = i.gym_id
  where i.token = invite_token;
$$;

-- 초대 수락: 로그인한 본인을 그 체육관 관장(코치)으로 연결. 한 번 쓴 링크는 재사용 불가.
create or replace function public.redeem_gym_invite(invite_token text)
returns text language plpgsql security definer set search_path = public as $$
declare
  inv gym_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'login_required';
  end if;
  select * into inv from gym_invites where token = invite_token for update;
  if not found then
    raise exception 'invalid_invite';
  end if;
  if inv.used_at is not null and inv.used_by is distinct from auth.uid() then
    raise exception 'invite_used';
  end if;
  if inv.expires_at < now() then
    raise exception 'invite_expired';
  end if;
  insert into gym_members (gym_id, user_id, role)
  values (inv.gym_id, auth.uid(), inv.role)
  on conflict (gym_id, user_id) do nothing;
  update gym_invites set used_by = auth.uid(), used_at = now()
  where token = invite_token and used_at is null;
  return inv.gym_id;
end;
$$;

-- ──────────────────────────────────────────────
-- 3. 보안 정책 (RLS) — 기존 정책을 지우고 역할 기준으로 다시 만든다
-- ──────────────────────────────────────────────
alter table admins      enable row level security;
alter table gym_members enable row level security;
alter table gym_invites enable row level security;

-- 운영자 목록: 본인 행만 조회 (내가 운영자인지 확인용). 추가는 SQL로만.
drop policy if exists "admins_self_read" on admins;
create policy "admins_self_read" on admins for select using (user_id = auth.uid());

-- 체육관-관장 연결: 본인 행, 같은 체육관 멤버, 운영자가 조회. 추가·삭제는 운영자만 (초대 수락은 함수로).
drop policy if exists "gym_members_read" on gym_members;
create policy "gym_members_read" on gym_members for select
  using (user_id = auth.uid() or is_gym_member(gym_id) or is_admin());
drop policy if exists "gym_members_admin_write" on gym_members;
create policy "gym_members_admin_write" on gym_members for all
  using (is_admin()) with check (is_admin());

-- 초대 링크: 운영자만
drop policy if exists "gym_invites_admin" on gym_invites;
create policy "gym_invites_admin" on gym_invites for all
  using (is_admin()) with check (is_admin());

-- 체육관: 누구나 조회 / 관장·운영자 수정 / 운영자만 등록·삭제
drop policy if exists "gyms_owner_write" on gyms;
drop policy if exists "gyms_member_update" on gyms;
create policy "gyms_member_update" on gyms for update
  using (is_gym_member(id) or is_admin()) with check (is_gym_member(id) or is_admin());
drop policy if exists "gyms_admin_insert" on gyms;
create policy "gyms_admin_insert" on gyms for insert with check (is_admin());
drop policy if exists "gyms_admin_delete" on gyms;
create policy "gyms_admin_delete" on gyms for delete using (is_admin());

-- 예약: 본인·그 체육관 관장·운영자 조회 / 로그인한 본인 명의로만 신청 / 상태 변경은 관장·운영자
drop policy if exists "bookings_read" on bookings;
create policy "bookings_read" on bookings for select
  using (auth.uid() = user_id or is_gym_member(gym_id) or is_admin());
drop policy if exists "bookings_insert" on bookings;
create policy "bookings_insert" on bookings for insert
  with check (auth.uid() is not null and user_id = auth.uid());
drop policy if exists "bookings_member_update" on bookings;
create policy "bookings_member_update" on bookings for update
  using (is_gym_member(gym_id) or is_admin()) with check (is_gym_member(gym_id) or is_admin());

-- 리뷰: 누구나 조회 / 로그인한 본인 명의로만 작성
-- TODO: 예약 이력이 있는 회원만 작성 가능하게
drop policy if exists "reviews_insert" on reviews;
create policy "reviews_insert" on reviews for insert
  with check (auth.uid() is not null and user_id = auth.uid());

-- 이벤트: 누구나 조회 / 그 체육관 관장·운영자만 등록·수정·삭제
drop policy if exists "events_owner_write" on events;
drop policy if exists "events_member_write" on events;
create policy "events_member_write" on events for all
  using (is_gym_member(gym_id) or is_admin()) with check (is_gym_member(gym_id) or is_admin());

-- 이벤트 신청 명단: 본인·그 체육관 관장·운영자
drop policy if exists "event_rsvps_read" on event_rsvps;
create policy "event_rsvps_read" on event_rsvps for select using (
  auth.uid() = user_id
  or is_admin()
  or is_gym_member((select e.gym_id from events e where e.id = event_rsvps.event_id))
);

-- 입점 요청: 누구나 요청 / 운영자만 조회
drop policy if exists "gym_requests_admin_read" on gym_requests;
create policy "gym_requests_admin_read" on gym_requests for select using (is_admin());

-- ──────────────────────────────────────────────
-- 4. 체육관 사진 저장소 (공개 읽기, 관장·운영자만 업로드·삭제)
--    경로 규칙: gym-photos/<체육관 id>/<파일명>
-- ──────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('gym-photos', 'gym-photos', true)
on conflict (id) do nothing;

drop policy if exists "gym_photos_public_read" on storage.objects;
create policy "gym_photos_public_read" on storage.objects
  for select using (bucket_id = 'gym-photos');
drop policy if exists "gym_photos_member_insert" on storage.objects;
create policy "gym_photos_member_insert" on storage.objects for insert with check (
  bucket_id = 'gym-photos' and (is_admin() or is_gym_member((storage.foldername(name))[1]))
);
drop policy if exists "gym_photos_member_delete" on storage.objects;
create policy "gym_photos_member_delete" on storage.objects for delete using (
  bucket_id = 'gym-photos' and (is_admin() or is_gym_member((storage.foldername(name))[1]))
);

-- ──────────────────────────────────────────────
-- 5. 나를 운영자로 등록 (한 번만)
--    앱에서 /ops 에 들어가면 내 회원 ID와 함께 아래 문장이 그대로 보인다.
--    insert into admins (user_id) values ('<내 회원 ID>') on conflict do nothing;
-- ──────────────────────────────────────────────

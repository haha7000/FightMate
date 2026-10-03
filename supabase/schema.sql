-- FightMate DB 스키마
-- Supabase 대시보드 → SQL Editor에 붙여넣고 실행하세요.
-- (또는 supabase CLI: supabase db push)

-- ──────────────────────────────────────────────
-- 1. 체육관
-- ──────────────────────────────────────────────
create table if not exists gyms (
  id            text primary key,
  name          text not null,
  disciplines   text[] not null default '{}',
  district      text not null,
  address       text not null,
  intro         text not null default '',
  trial_price   integer not null default 0,
  day_pass_price integer,                       -- null = 1일권 미운영
  monthly_price integer,
  rating        numeric(2,1) not null default 0,
  review_count  integer not null default 0,
  emoji         text not null default '🥊',
  amenities     text[] not null default '{}',
  photos        jsonb not null default '[]',   -- [{ src, caption }]
  owner_id      uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- 지도 표시용 좌표 + 카카오 장소 ID (2026-09-30-map.sql)
alter table gyms add column if not exists lat double precision;
alter table gyms add column if not exists lng double precision;
alter table gyms add column if not exists kakao_place_id text;

-- ──────────────────────────────────────────────
-- 2. 파이터 프로필 (로그인 유저당 1개)
-- ──────────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  nickname     text,
  discipline   text,
  weight_class text,
  gym_name     text,
  years        text,
  belt         text,
  updated_at   timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 3. 예약/체험 신청
-- ──────────────────────────────────────────────
create table if not exists bookings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  gym_id     text not null references gyms(id),
  gym_name   text not null,
  name       text not null,
  phone      text not null,
  date       date not null,
  type       text not null default '체험',          -- 체험 | 1일권
  status     text not null default '신청됨',          -- 신청됨 | 확정 | 사용 완료
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 4. 리뷰
-- ──────────────────────────────────────────────
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  gym_id     text not null references gyms(id),
  user_id    uuid references auth.users(id) on delete set null,
  author     text not null default '익명',
  rating     integer not null check (rating between 1 and 5),
  text       text not null,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 5. 이벤트 (오픈매트·세미나·대회 등)
-- ──────────────────────────────────────────────
create table if not exists events (
  id               text primary key,
  gym_id           text not null references gyms(id),
  gym_name         text not null,
  kind             text not null default '오픈매트',  -- 오픈매트|세미나|대회|특별수업|행사
  title            text not null,
  date             date not null,
  start_time       text not null default '14:00',
  fee              integer not null default 0,
  capacity         integer,
  attendees        integer not null default 0,   -- 시드 베이스라인 인원
  rsvp_count       integer not null default 0,   -- 실제 RSVP 수 (트리거로 자동 갱신). 표시 인원 = attendees + rsvp_count
  description      text not null default '',
  poster_url       text,                          -- 대회·세미나 포스터 이미지 (Storage 공개 URL)
  open_to_visitors boolean not null default true,
  created_at       timestamptz not null default now()
);

-- 기존 테이블에도 새 컬럼이 반영되도록 (create if not exists는 컬럼을 추가하지 않음)
alter table events add column if not exists attendees  integer not null default 0;
alter table events add column if not exists rsvp_count integer not null default 0;
alter table events add column if not exists poster_url text;

create index if not exists events_date_idx on events (date);
create index if not exists events_gym_idx on events (gym_id);

-- ──────────────────────────────────────────────
-- 6. 이벤트 참가 신청 (RSVP)
--    한 줄 = 신청 1건. 표시 인원 = events.attendees(베이스라인) + 이 테이블 행 수.
--    unique(event_id, user_id)로 1인 1신청 보장.
-- ──────────────────────────────────────────────
create table if not exists event_rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   text not null references events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null default '',   -- 관장이 명단에서 확인 (본인·관장만 조회 가능)
  phone      text not null default '',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table event_rsvps add column if not exists name  text not null default '';
alter table event_rsvps add column if not exists phone text not null default '';

create index if not exists event_rsvps_event_idx on event_rsvps (event_id);
create index if not exists event_rsvps_user_idx on event_rsvps (user_id);

-- RSVP 수를 events.rsvp_count에 자동 반영 (security definer: events RLS 우회해 집계만 갱신)
create or replace function sync_event_rsvp_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    update events set rsvp_count = rsvp_count + 1 where id = NEW.event_id;
  elsif (TG_OP = 'DELETE') then
    update events set rsvp_count = greatest(0, rsvp_count - 1) where id = OLD.event_id;
  end if;
  return null;
end;
$$;

drop trigger if exists event_rsvps_count_trg on event_rsvps;
create trigger event_rsvps_count_trg
  after insert or delete on event_rsvps
  for each row execute function sync_event_rsvp_count();

-- ──────────────────────────────────────────────
-- RLS (Row Level Security)
-- anon 키는 공개되므로 반드시 켠다.
-- ──────────────────────────────────────────────
alter table gyms        enable row level security;
alter table profiles    enable row level security;
alter table bookings    enable row level security;
alter table reviews     enable row level security;
alter table events      enable row level security;
alter table event_rsvps enable row level security;

-- 체육관: 누구나 조회, 소유 관장만 수정
drop policy if exists "gyms_public_read" on gyms;
create policy "gyms_public_read" on gyms for select using (true);
drop policy if exists "gyms_owner_write" on gyms;
create policy "gyms_owner_write" on gyms for update using (auth.uid() = owner_id);

-- 프로필: 누구나 조회, 본인만 생성/수정
drop policy if exists "profiles_public_read" on profiles;
create policy "profiles_public_read" on profiles for select using (true);
drop policy if exists "profiles_self_upsert" on profiles;
create policy "profiles_self_upsert" on profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_self_update" on profiles;
create policy "profiles_self_update" on profiles for update using (auth.uid() = id);

-- 예약: 본인 것 + 해당 체육관 관장이 조회, 로그인 유저가 생성
drop policy if exists "bookings_read" on bookings;
create policy "bookings_read" on bookings for select using (
  auth.uid() = user_id
  or auth.uid() = (select owner_id from gyms where gyms.id = bookings.gym_id)
);
drop policy if exists "bookings_insert" on bookings;
create policy "bookings_insert" on bookings for insert with check (true);

-- 리뷰: 누구나 조회, 로그인 유저가 작성
drop policy if exists "reviews_public_read" on reviews;
create policy "reviews_public_read" on reviews for select using (true);
drop policy if exists "reviews_insert" on reviews;
create policy "reviews_insert" on reviews for insert with check (true);

-- 이벤트: 누구나 조회, 해당 체육관 관장만 등록/수정/삭제
drop policy if exists "events_public_read" on events;
create policy "events_public_read" on events for select using (true);
drop policy if exists "events_owner_write" on events;
create policy "events_owner_write" on events for all using (
  auth.uid() = (select owner_id from gyms where gyms.id = events.gym_id)
);

-- RSVP: 본인 또는 해당 체육관 관장만 조회(연락처 보호), 본인 것만 신청/취소.
-- 공개 인원 카운트는 events.rsvp_count(트리거 집계)로 노출되므로 여기서 public read 불필요.
drop policy if exists "event_rsvps_public_read" on event_rsvps;
drop policy if exists "event_rsvps_read" on event_rsvps;
create policy "event_rsvps_read" on event_rsvps for select using (
  auth.uid() = user_id
  or auth.uid() = (
    select g.owner_id from events e join gyms g on g.id = e.gym_id
    where e.id = event_rsvps.event_id
  )
);
drop policy if exists "event_rsvps_self_insert" on event_rsvps;
create policy "event_rsvps_self_insert" on event_rsvps for insert with check (auth.uid() = user_id);
drop policy if exists "event_rsvps_self_delete" on event_rsvps;
create policy "event_rsvps_self_delete" on event_rsvps for delete using (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- 프로필 생성 정책
-- 별도 트리거를 두지 않는다. 프로필은 앱에서 "파이터 카드" 저장 시
-- profiles upsert로 생성된다(saveProfile). auth.users 트리거는 Supabase
-- 권한 환경에서 "Database error saving new user"를 유발하기 쉬워 제거.
-- (이미 트리거를 만들었다면 아래로 제거)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- ──────────────────────────────────────────────
-- Storage: 이벤트 포스터 버킷
-- 먼저 대시보드 Storage에서 'event-posters' 버킷을 Public으로 생성한 뒤 실행.
-- (공개 읽기는 Public 버킷이 자동 제공, 업로드는 로그인 유저 허용)
-- ──────────────────────────────────────────────
drop policy if exists "event_posters_public_read" on storage.objects;
create policy "event_posters_public_read" on storage.objects
  for select using (bucket_id = 'event-posters');
drop policy if exists "event_posters_auth_insert" on storage.objects;
create policy "event_posters_auth_insert" on storage.objects
  for insert with check (bucket_id = 'event-posters' and auth.role() = 'authenticated');
drop policy if exists "event_posters_owner_delete" on storage.objects;
create policy "event_posters_owner_delete" on storage.objects
  for delete using (bucket_id = 'event-posters' and auth.uid() = owner);

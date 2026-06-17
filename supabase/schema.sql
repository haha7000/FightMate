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
  day_pass_price integer not null default 0,
  monthly_price integer,
  rating        numeric(2,1) not null default 0,
  review_count  integer not null default 0,
  emoji         text not null default '🥊',
  amenities     text[] not null default '{}',
  photos        jsonb not null default '[]',   -- [{ src, caption }]
  owner_id      uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

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
  description      text not null default '',
  open_to_visitors boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists events_date_idx on events (date);
create index if not exists events_gym_idx on events (gym_id);

-- ──────────────────────────────────────────────
-- RLS (Row Level Security)
-- anon 키는 공개되므로 반드시 켠다.
-- ──────────────────────────────────────────────
alter table gyms     enable row level security;
alter table profiles enable row level security;
alter table bookings enable row level security;
alter table reviews  enable row level security;
alter table events   enable row level security;

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

-- ──────────────────────────────────────────────
-- 프로필 생성 정책
-- 별도 트리거를 두지 않는다. 프로필은 앱에서 "파이터 카드" 저장 시
-- profiles upsert로 생성된다(saveProfile). auth.users 트리거는 Supabase
-- 권한 환경에서 "Database error saving new user"를 유발하기 쉬워 제거.
-- (이미 트리거를 만들었다면 아래로 제거)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

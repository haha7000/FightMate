-- 지도 기능 마이그레이션 (2026-09-30)
-- Supabase 대시보드 → SQL Editor에 붙여넣고 실행. 여러 번 실행해도 안전.

-- 1. 체육관 좌표 + 카카오 장소 ID (지도 검색 결과와 중복 제거용)
alter table gyms add column if not exists lat double precision;
alter table gyms add column if not exists lng double precision;
alter table gyms add column if not exists kakao_place_id text;

-- 시드 체육관 좌표 (카카오 주소검색. 실존하지 않는 데모 주소는 동 중심 좌표)
update gyms set lat = 37.4995539, lng = 127.0313935 where id = 'gracie-yeoksam' and lat is null;
update gyms set lat = 37.5126452, lng = 127.0301548 where id = 'ironfist-gangnam' and lat is null;
update gyms set lat = 37.4932422, lng = 127.0566935 where id = 'topteam-seolleung' and lat is null;
update gyms set lat = 37.5198382, lng = 127.0297655 where id = 'muay-thai-sinsa' and lat is null;
update gyms set lat = 37.4720040, lng = 127.0374639 where id = 'wrestling-club-yangjae' and lat is null;
update gyms set lat = 37.5306686, lng = 127.0308092 where id = 'checkmat-apgujeong' and lat is null;

-- 2. 미입점 체육관 입점 요청 (= 영업 리드)
create table if not exists gym_requests (
  id             uuid primary key default gen_random_uuid(),
  kakao_place_id text not null,
  name           text not null,
  address        text not null default '',
  phone          text not null default '',
  user_id        uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists gym_requests_place_idx on gym_requests (kakao_place_id);

-- 누구나 요청 가능, 조회는 대시보드(서비스 키)에서만
alter table gym_requests enable row level security;
drop policy if exists "gym_requests_insert" on gym_requests;
create policy "gym_requests_insert" on gym_requests for insert with check (true);

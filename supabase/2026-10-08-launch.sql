-- 출시 준비 (2026-10-08)
-- SQL Editor에서 실행. 여러 번 실행해도 안전. (2026-10-07-notify.sql 다음에 실행)
-- 지금 배포된 앱과도 호환된다 (새 컬럼·함수 추가 위주, 기존 동작을 깨지 않음).

-- ──────────────────────────────────────────────
-- 1. 체육관: 연락처 · 운영시간 · 시간표 이미지 · 공개 여부
-- ──────────────────────────────────────────────
alter table gyms add column if not exists phone text;            -- 손님이 거는 체육관 번호 (공개)
alter table gyms add column if not exists hours text;            -- 운영시간 (자유 입력, 여러 줄)
alter table gyms add column if not exists timetable_url text;    -- 수업 시간표 이미지 (gym-photos 저장소)
alter table gyms add column if not exists is_published boolean not null default true;  -- 운영자가 숨기기

-- 숨긴 체육관은 손님에게 안 보이고, 그 체육관 관장·운영자만 본다
drop policy if exists "gyms_public_read" on gyms;
create policy "gyms_public_read" on gyms for select
  using (is_published or is_gym_member(id) or is_admin());

-- ──────────────────────────────────────────────
-- 2. 신청: 희망 시간대 · 요청사항 · 손님 취소 · 중복 방지
-- ──────────────────────────────────────────────
alter table bookings add column if not exists preferred_time text;  -- 오전 | 오후 | 저녁 | 상관없음
alter table bookings add column if not exists note text;            -- 운동 경력·질문 (300자)

alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status in ('신청됨', '확정', '거절', '사용 완료', '취소'));

-- 손님 본인 취소: 진행 중(신청됨·확정)인 본인 신청만 '취소'로. 다른 값은 못 바꾼다.
create or replace function public.cancel_my_booking(bid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update bookings set status = '취소'
  where id = bid and user_id = auth.uid() and status in ('신청됨', '확정');
  if not found then
    raise exception 'cannot_cancel';
  end if;
end;
$$;

-- 같은 사람이 같은 체육관·같은 날짜·같은 종류로 진행 중인 신청을 두 번 못 하게.
-- (인덱스를 만들기 전에, 이미 쌓인 중복은 가장 먼저 낸 것만 남기고 '취소' 처리 — 테스트 데이터 정리)
update bookings b set status = '취소'
where b.status in ('신청됨', '확정') and b.user_id is not null
  and exists (
    select 1 from bookings b2
    where b2.user_id = b.user_id and b2.gym_id = b.gym_id and b2.date = b.date and b2.type = b.type
      and b2.status in ('신청됨', '확정') and b2.created_at < b.created_at
  );
create unique index if not exists bookings_no_duplicate
  on bookings (user_id, gym_id, date, type)
  where status in ('신청됨', '확정') and user_id is not null;

-- ──────────────────────────────────────────────
-- 3. 평점·리뷰 수를 실제 리뷰로 계산 (지금까지는 시드에 박힌 값이었음)
-- ──────────────────────────────────────────────
create or replace function public.refresh_gym_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  gid text := coalesce(new.gym_id, old.gym_id);
begin
  update gyms g
  set review_count = s.cnt, rating = s.avg
  from (
    select count(*)::int as cnt, coalesce(round(avg(rating)::numeric, 1), 0) as avg
    from reviews where gym_id = gid
  ) s
  where g.id = gid;
  return null;
end;
$$;

drop trigger if exists reviews_refresh_gym_rating on reviews;
create trigger reviews_refresh_gym_rating
  after insert or update or delete on reviews
  for each row execute function refresh_gym_rating();

-- 한 번 전체 다시 계산 (리뷰가 없는 체육관은 0점·0개 → 앱에서 "새로 입점"으로 표시)
update gyms g set
  review_count = (select count(*) from reviews r where r.gym_id = g.id),
  rating = coalesce((select round(avg(r.rating)::numeric, 1) from reviews r where r.gym_id = g.id), 0);

-- ──────────────────────────────────────────────
-- 4. 리뷰는 방문을 마친 회원만 (관장이 "방문 완료" 처리한 신청이 있어야)
-- ──────────────────────────────────────────────
drop policy if exists "reviews_insert" on reviews;
create policy "reviews_insert" on reviews for insert with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and exists (
    select 1 from bookings b
    where b.user_id = auth.uid() and b.gym_id = reviews.gym_id and b.status = '사용 완료'
  )
);

-- ──────────────────────────────────────────────
-- 5. 회원 탈퇴: 개인정보를 지우고 계정 삭제
--   · 신청 기록은 체육관 장부라 남기되 이름·연락처·요청사항은 지운다
--   · 리뷰는 남기되 작성자를 "탈퇴한 회원"으로
--   · 프로필·이벤트 신청·관장 연결은 계정과 함께 삭제 (외래키 cascade)
-- ──────────────────────────────────────────────
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'login_required';
  end if;
  update bookings set name = '탈퇴한 회원', phone = '', note = null where user_id = uid;
  update reviews set author = '탈퇴한 회원' where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;

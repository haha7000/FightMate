-- 예약 상태가 바뀐 시각 기록 (2026-10-06)
-- 관장 모드 "지난 내역"에서 언제 거절·확정했는지 보여주기 위함.
-- SQL Editor에서 실행. 여러 번 실행해도 안전. (2026-10-05-roles.sql 다음에 실행)

alter table bookings add column if not exists status_changed_at timestamptz;

create or replace function set_booking_status_changed_at()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_status_changed_trg on bookings;
create trigger bookings_status_changed_trg
  before update on bookings
  for each row execute function set_booking_status_changed_at();

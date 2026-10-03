-- 데모 이벤트를 다시 '다가오는 일정'으로 옮기기
-- 시드 이벤트 날짜가 지나서 이벤트 탭이 비었을 때 SQL Editor에서 실행. 여러 번 실행해도 안전.
-- (관장이 직접 등록한 이벤트는 건드리지 않음 — 아래 7개 데모 ID만)

update events set date = current_date + 1 + ((6 - extract(dow from current_date + 1)::int + 7) % 7) + 0 where id = 'ev-gracie-openmat-0621';
update events set date = current_date + 1 + ((0 - extract(dow from current_date + 1)::int + 7) % 7) + 7 where id = 'ev-topteam-seminar-0628';
update events set date = current_date + 1 + ((5 - extract(dow from current_date + 1)::int + 7) % 7) + 0 where id = 'ev-checkmat-openmat-0620';
update events set date = current_date + 1 + ((4 - extract(dow from current_date + 1)::int + 7) % 7) + 0 where id = 'ev-ironfist-class-0619';
update events set date = current_date + 1 + ((6 - extract(dow from current_date + 1)::int + 7) % 7) + 7 where id = 'ev-muaythai-event-0627';
update events set date = current_date + 1 + ((0 - extract(dow from current_date + 1)::int + 7) % 7) + 21 where id = 'ev-topteam-comp-0712';
update events set date = current_date + 1 + ((6 - extract(dow from current_date + 1)::int + 7) % 7) + 7 where id = 'ev-gracie-openmat-0628';

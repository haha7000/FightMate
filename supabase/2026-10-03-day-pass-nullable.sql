-- 1일권 "미운영"을 저장할 수 있게 (2026-10-03)
-- 앱은 day_pass_price = null 을 "1일권 미운영"으로 해석한다. 지금은 not null default 0이라 표현 불가.
-- SQL Editor에서 실행. 여러 번 실행해도 안전.

alter table gyms alter column day_pass_price drop not null;
alter table gyms alter column day_pass_price drop default;

-- 데모 체육관 중 1일권 미운영 (목데이터와 맞춤 — 1일권 필터가 실제로 걸러지도록)
update gyms set day_pass_price = null where id in ('ironfist-gangnam', 'wrestling-club-yangjae');

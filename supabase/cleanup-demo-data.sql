-- ⚠️ 실제 출시 직전에만 실행: 데모 체육관·이벤트·리뷰 정리
-- 지금(개발·테스트 중)은 실행하지 말 것 — 화면에 보일 데이터가 사라진다.
-- 2026-10-08-launch.sql 다음에 실행. 여러 번 실행해도 안전.

-- 1. 데모 이벤트 삭제 (시드로 넣은 7개. 관장이 직접 올린 일정은 건드리지 않음)
delete from events where id in (
  'ev-gracie-openmat-0621', 'ev-topteam-seminar-0628', 'ev-checkmat-openmat-0620',
  'ev-ironfist-class-0619', 'ev-muaythai-event-0627', 'ev-topteam-comp-0712', 'ev-gracie-openmat-0628'
);

-- 2. 데모 리뷰 삭제 (회원이 쓴 리뷰는 user_id가 있음 → 시드 리뷰만 지워짐). 평점은 트리거가 다시 계산.
delete from reviews where user_id is null;

-- 3. 데모 체육관 숨기기 (삭제하면 테스트 신청 기록과 얽혀 있어 숨김 처리. 운영자 화면에서 다시 켤 수 있음)
update gyms set is_published = false where id in (
  'gracie-yeoksam', 'ironfist-gangnam', 'topteam-seolleung',
  'muay-thai-sinsa', 'wrestling-club-yangjae', 'checkmat-apgujeong'
);

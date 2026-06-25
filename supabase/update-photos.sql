-- 체육관 사진을 실제 스톡 사진으로 교체.
-- Supabase SQL Editor에 붙여넣고 실행하세요. (기존 행을 UPDATE)
-- 사진 파일은 public/gyms/*.jpg 에 있고 배포 시 함께 올라갑니다.

update gyms set photos = '[{"src":"/gyms/gracie-1.jpg","caption":"스파링"},{"src":"/gyms/gracie-2.jpg","caption":"기술 훈련"},{"src":"/gyms/gracie-3.jpg","caption":"오픈매트"}]'
  where id = 'gracie-yeoksam';
update gyms set photos = '[{"src":"/gyms/ironfist-1.jpg","caption":"미트 트레이닝"},{"src":"/gyms/ironfist-2.jpg","caption":"샌드백 훈련"},{"src":"/gyms/ironfist-3.jpg","caption":"스파링"}]'
  where id = 'ironfist-gangnam';
update gyms set photos = '[{"src":"/gyms/topteam-1.jpg","caption":"케이지 스파링"},{"src":"/gyms/topteam-2.jpg","caption":"그래플링"},{"src":"/gyms/topteam-3.jpg","caption":"시합반 훈련"}]'
  where id = 'topteam-seolleung';
update gyms set photos = '[{"src":"/gyms/muaythai-1.jpg","caption":"클린치 훈련"},{"src":"/gyms/muaythai-2.jpg","caption":"패드 훈련"},{"src":"/gyms/muaythai-3.jpg","caption":"스파링"}]'
  where id = 'muay-thai-sinsa';
update gyms set photos = '[{"src":"/gyms/wrestling-1.jpg","caption":"케이지 훈련"},{"src":"/gyms/wrestling-2.jpg","caption":"테이크다운"},{"src":"/gyms/wrestling-3.jpg","caption":"스파링"}]'
  where id = 'wrestling-club-yangjae';
update gyms set photos = '[{"src":"/gyms/checkmat-1.jpg","caption":"노기 롤링"},{"src":"/gyms/checkmat-2.jpg","caption":"기술 훈련"},{"src":"/gyms/checkmat-3.jpg","caption":"오픈매트"}]'
  where id = 'checkmat-apgujeong';

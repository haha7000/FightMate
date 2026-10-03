-- FightMate 시드 데이터
-- schema.sql 실행 후, SQL Editor에 붙여넣고 실행하세요.

insert into gyms (id, name, disciplines, district, address, intro, trial_price, day_pass_price, monthly_price, rating, review_count, emoji, amenities, photos) values
('gracie-yeoksam', '그레이시 주짓수 역삼', '{"주짓수"}', '강남구 역삼동', '서울 강남구 테헤란로 123 지하 1층',
 '초보 환영, 화이트벨트 전용 클래스 운영. 오픈매트 매주 토요일.', 0, 20000, 180000, 4.8, 41, '🥋',
 '{"운동복 대여","수건 제공","샤워실","개인 락커"}',
 '[{"src":"/gyms/gracie-1.jpg","caption":"스파링"},{"src":"/gyms/gracie-2.jpg","caption":"기술 훈련"},{"src":"/gyms/gracie-3.jpg","caption":"오픈매트"}]'),
('ironfist-gangnam', '아이언피스트 복싱 강남', '{"복싱"}', '강남구 논현동', '서울 강남구 학동로 45 3층',
 '직장인 새벽반·심야반 운영. 1:1 미트 트레이닝 강점.', 10000, 15000, 150000, 4.6, 27, '🥊',
 '{"운동복 대여","수건 제공","샤워실","글러브·장비 대여"}',
 '[{"src":"/gyms/ironfist-1.jpg","caption":"미트 트레이닝"},{"src":"/gyms/ironfist-2.jpg","caption":"샌드백 훈련"},{"src":"/gyms/ironfist-3.jpg","caption":"스파링"}]'),
('topteam-seolleung', '탑팀 MMA 선릉', '{"MMA","주짓수","킥복싱"}', '강남구 대치동', '서울 강남구 선릉로 88 2층',
 '아마추어 대회 출전팀 운영. 입문부터 시합반까지.', 0, 25000, 200000, 4.9, 63, '🏆',
 '{"운동복 대여","샤워실","개인 락커","글러브·장비 대여","주차 가능"}',
 '[{"src":"/gyms/topteam-1.jpg","caption":"케이지 스파링"},{"src":"/gyms/topteam-2.jpg","caption":"그래플링"},{"src":"/gyms/topteam-3.jpg","caption":"시합반 훈련"}]'),
('muay-thai-sinsa', '싸바이 무에타이 신사', '{"무에타이","킥복싱"}', '강남구 신사동', '서울 강남구 도산대로 210 지하 1층',
 '태국 현지 출신 코치 상주. 여성 회원 비율 높음.', 15000, 20000, 170000, 4.7, 35, '🇹🇭',
 '{"수건 제공","샤워실","글러브·장비 대여"}',
 '[{"src":"/gyms/muaythai-1.jpg","caption":"클린치 훈련"},{"src":"/gyms/muaythai-2.jpg","caption":"패드 훈련"},{"src":"/gyms/muaythai-3.jpg","caption":"스파링"}]'),
('wrestling-club-yangjae', '양재 레슬링 클럽', '{"레슬링","MMA"}', '서초구 양재동', '서울 서초구 강남대로 12 4층',
 '엘리트 선수 출신 코치진. 테이크다운 특화 커리큘럼.', 0, 18000, 160000, 4.5, 19, '🤼',
 '{"샤워실","주차 가능"}',
 '[{"src":"/gyms/wrestling-1.jpg","caption":"케이지 훈련"},{"src":"/gyms/wrestling-2.jpg","caption":"테이크다운"},{"src":"/gyms/wrestling-3.jpg","caption":"스파링"}]'),
('checkmat-apgujeong', '체크매트 압구정', '{"주짓수"}', '강남구 압구정동', '서울 강남구 압구정로 77 지하 2층',
 '노기 클래스 매일 운영. 외국인 회원 다수, 원정 환영.', 10000, 25000, 190000, 4.8, 52, '🟦',
 '{"운동복 대여","수건 제공","샤워실","개인 락커","주차 가능"}',
 '[{"src":"/gyms/checkmat-1.jpg","caption":"노기 롤링"},{"src":"/gyms/checkmat-2.jpg","caption":"기술 훈련"},{"src":"/gyms/checkmat-3.jpg","caption":"오픈매트"}]')
on conflict (id) do nothing;

insert into reviews (gym_id, author, rating, text, created_at) values
('gracie-yeoksam', '파랑띠지망생', 5, '화이트벨트 클래스가 따로 있어서 민폐 걱정 없이 배웠어요. 관장님이 기본기를 정말 꼼꼼히 봐주십니다.', '2026-05-28'),
('gracie-yeoksam', '직장인주짓떼로', 4, '토요일 오픈매트 분위기 좋아요. 샤워실이 조금 좁은 것만 빼면 만족.', '2026-05-12'),
('ironfist-gangnam', '복싱입문자', 5, '새벽반 듣는데 미트 트레이닝이 진짜 시원합니다. 스트레스가 풀려요.', '2026-06-01'),
('topteam-seolleung', '아마추어3전', 5, '시합반 커리큘럼이 체계적이에요. 대회 준비하시는 분들께 추천.', '2026-05-20'),
('muay-thai-sinsa', '무에타이N년차', 4, '코치님 클린치 디테일이 남다릅니다. 여성 회원이 많아서 분위기도 편해요.', '2026-05-30'),
('checkmat-apgujeong', '노기러버', 5, '노기 클래스가 매일 있는 곳이 드문데 여기가 그 곳. 외국인 회원들과 스파링하는 재미가 있습니다.', '2026-06-03');

-- ── 이벤트 시드 (기준일 2026-06-14) ──
-- 데모 이벤트 날짜는 실행일 기준 다가오는 요일로 계산 (고정 날짜는 금방 지나버림)
insert into events (id, gym_id, gym_name, kind, title, date, start_time, fee, capacity, attendees, description, open_to_visitors) values
('ev-gracie-openmat-0621','gracie-yeoksam','그레이시 주짓수 역삼','오픈매트','토요 오픈매트 (초보 환영)',current_date + 1 + ((6 - extract(dow from current_date + 1)::int + 7) % 7) + 0,'14:00',0,30,22,'매주 토요일 열리는 오픈매트입니다. 화이트벨트도 부담 없이 참여하세요. 가벼운 롤링 위주, 타 체육관 방문 환영.',true),
('ev-topteam-seminar-0628','topteam-seolleung','탑팀 MMA 선릉','세미나','레슬링 테이크다운 세미나 (게스트 코치)',current_date + 1 + ((0 - extract(dow from current_date + 1)::int + 7) % 7) + 7,'11:00',30000,24,24,'국가대표 출신 게스트 코치의 테이크다운 세미나. MMA·그래플러 모두 환영. 노기 복장 권장.',true),
('ev-checkmat-openmat-0620','checkmat-apgujeong','체크매트 압구정','오픈매트','노기 오픈매트',current_date + 1 + ((5 - extract(dow from current_date + 1)::int + 7) % 7) + 0,'19:00',10000,null,0,'금요일 저녁 노기 오픈매트. 외국인 회원 다수, 다양한 스타일과 롤링 가능.',true),
('ev-ironfist-class-0619','ironfist-gangnam','아이언피스트 복싱 강남','특별수업','초보 복싱 입문 원데이 클래스',current_date + 1 + ((4 - extract(dow from current_date + 1)::int + 7) % 7) + 0,'20:00',20000,12,11,'스텝·잽·원투 기본기를 하루에 배우는 입문 클래스. 장비 무료 대여.',true),
('ev-muaythai-event-0627','muay-thai-sinsa','싸바이 무에타이 신사','행사','와이크루 데이 + 회원 친선 스파링',current_date + 1 + ((6 - extract(dow from current_date + 1)::int + 7) % 7) + 7,'18:00',0,40,18,'무에타이 전통 의식 와이크루 시연과 회원 친선 스파링. 관람·체험 모두 환영.',true),
('ev-topteam-comp-0712','topteam-seolleung','탑팀 MMA 선릉','대회','강남 아마추어 그래플링 오픈 (체급별)',current_date + 1 + ((0 - extract(dow from current_date + 1)::int + 7) % 7) + 21,'10:00',50000,128,47,'체급·벨트별 브래킷으로 진행되는 아마추어 그래플링 대회. 검증된 전적으로 기록됩니다.',true),
('ev-gracie-openmat-0628','gracie-yeoksam','그레이시 주짓수 역삼','오픈매트','토요 오픈매트 (초보 환영)',current_date + 1 + ((6 - extract(dow from current_date + 1)::int + 7) % 7) + 7,'14:00',0,30,9,'매주 토요일 오픈매트. 화이트벨트 환영, 타 체육관 방문 환영.',true)
on conflict (id) do nothing;

export type Discipline = "주짓수" | "복싱" | "MMA" | "킥복싱" | "무에타이" | "레슬링";

export const DISCIPLINES: Discipline[] = ["주짓수", "복싱", "MMA", "킥복싱", "무에타이", "레슬링"];

export type Amenity =
  | "운동복 대여"
  | "수건 제공"
  | "샤워실"
  | "개인 락커"
  | "글러브·장비 대여"
  | "주차 가능";

export const AMENITIES: { key: Amenity; emoji: string }[] = [
  { key: "운동복 대여", emoji: "👕" },
  { key: "수건 제공", emoji: "🧺" },
  { key: "샤워실", emoji: "🚿" },
  { key: "개인 락커", emoji: "🔐" },
  { key: "글러브·장비 대여", emoji: "🥊" },
  { key: "주차 가능", emoji: "🚗" },
];

export interface Gym {
  id: string;
  name: string;
  disciplines: Discipline[];
  district: string; // 예: 강남구 역삼동
  address: string;
  intro: string;
  trialPrice: number; // 체험 1회
  dayPassPrice: number; // 1일권
  monthlyPrice: number | null; // 정기 (참고 표시용)
  rating: number;
  reviewCount: number;
  emoji: string; // 사진 들어오기 전 임시 비주얼
  amenities: Amenity[];
  photos: GymPhoto[]; // 관장이 등록하는 시설·훈련 사진
  lat: number | null; // 지도 표시용 좌표 (없으면 지도에서 제외)
  lng: number | null;
  kakaoPlaceId: string | null; // 카카오 장소 ID — 지도 검색 결과와 중복 제거용
}

export interface GymPhoto {
  src: string;
  caption: string; // 예: 매트 존, 샤워실, 그룹 클래스
}

// 운동복 + 수건이 다 되면 빈손으로 가도 되는 체육관
export function isHandsFree(gym: Gym): boolean {
  return gym.amenities.includes("운동복 대여") && gym.amenities.includes("수건 제공");
}

// TODO(M1→M2): Supabase `gyms` 테이블로 교체
export const MOCK_GYMS: Gym[] = [
  {
    id: "gracie-yeoksam",
    name: "그레이시 주짓수 역삼",
    disciplines: ["주짓수"],
    district: "강남구 역삼동",
    address: "서울 강남구 테헤란로 123 지하 1층",
    intro: "초보 환영, 화이트벨트 전용 클래스 운영. 오픈매트 매주 토요일.",
    trialPrice: 0,
    dayPassPrice: 20000,
    monthlyPrice: 180000,
    rating: 4.8,
    reviewCount: 41,
    emoji: "🥋",
    amenities: ["운동복 대여", "수건 제공", "샤워실", "개인 락커"],
    photos: [{ src: "/gyms/gracie-1.jpg", caption: "스파링" }, { src: "/gyms/gracie-2.jpg", caption: "기술 훈련" }, { src: "/gyms/gracie-3.jpg", caption: "오픈매트" }],
    lat: 37.4995539,
    lng: 127.0313935,
    kakaoPlaceId: null,
  },
  {
    id: "ironfist-gangnam",
    name: "아이언피스트 복싱 강남",
    disciplines: ["복싱"],
    district: "강남구 논현동",
    address: "서울 강남구 학동로 45 3층",
    intro: "직장인 새벽반·심야반 운영. 1:1 미트 트레이닝 강점.",
    trialPrice: 10000,
    dayPassPrice: 15000,
    monthlyPrice: 150000,
    rating: 4.6,
    reviewCount: 27,
    emoji: "🥊",
    amenities: ["운동복 대여", "수건 제공", "샤워실", "글러브·장비 대여"],
    photos: [{ src: "/gyms/ironfist-1.jpg", caption: "미트 트레이닝" }, { src: "/gyms/ironfist-2.jpg", caption: "샌드백 훈련" }, { src: "/gyms/ironfist-3.jpg", caption: "스파링" }],
    lat: 37.5126452,
    lng: 127.0301548,
    kakaoPlaceId: null,
  },
  {
    id: "topteam-seolleung",
    name: "탑팀 MMA 선릉",
    disciplines: ["MMA", "주짓수", "킥복싱"],
    district: "강남구 대치동",
    address: "서울 강남구 선릉로 88 2층",
    intro: "아마추어 대회 출전팀 운영. 입문부터 시합반까지.",
    trialPrice: 0,
    dayPassPrice: 25000,
    monthlyPrice: 200000,
    rating: 4.9,
    reviewCount: 63,
    emoji: "🏆",
    amenities: ["운동복 대여", "샤워실", "개인 락커", "글러브·장비 대여", "주차 가능"],
    photos: [{ src: "/gyms/topteam-1.jpg", caption: "케이지 스파링" }, { src: "/gyms/topteam-2.jpg", caption: "그래플링" }, { src: "/gyms/topteam-3.jpg", caption: "시합반 훈련" }],
    lat: 37.4932422,
    lng: 127.0566935,
    kakaoPlaceId: null,
  },
  {
    id: "muay-thai-sinsa",
    name: "싸바이 무에타이 신사",
    disciplines: ["무에타이", "킥복싱"],
    district: "강남구 신사동",
    address: "서울 강남구 도산대로 210 지하 1층",
    intro: "태국 현지 출신 코치 상주. 여성 회원 비율 높음.",
    trialPrice: 15000,
    dayPassPrice: 20000,
    monthlyPrice: 170000,
    rating: 4.7,
    reviewCount: 35,
    emoji: "🇹🇭",
    amenities: ["수건 제공", "샤워실", "글러브·장비 대여"],
    photos: [{ src: "/gyms/muaythai-1.jpg", caption: "클린치 훈련" }, { src: "/gyms/muaythai-2.jpg", caption: "패드 훈련" }, { src: "/gyms/muaythai-3.jpg", caption: "스파링" }],
    lat: 37.5198382,
    lng: 127.0297655,
    kakaoPlaceId: null,
  },
  {
    id: "wrestling-club-yangjae",
    name: "양재 레슬링 클럽",
    disciplines: ["레슬링", "MMA"],
    district: "서초구 양재동",
    address: "서울 서초구 강남대로 12 4층",
    intro: "엘리트 선수 출신 코치진. 테이크다운 특화 커리큘럼.",
    trialPrice: 0,
    dayPassPrice: 18000,
    monthlyPrice: 160000,
    rating: 4.5,
    reviewCount: 19,
    emoji: "🤼",
    amenities: ["샤워실", "주차 가능"],
    photos: [{ src: "/gyms/wrestling-1.jpg", caption: "케이지 훈련" }, { src: "/gyms/wrestling-2.jpg", caption: "테이크다운" }, { src: "/gyms/wrestling-3.jpg", caption: "스파링" }],
    lat: 37.472004,
    lng: 127.0374639,
    kakaoPlaceId: null,
  },
  {
    id: "checkmat-apgujeong",
    name: "체크매트 압구정",
    disciplines: ["주짓수"],
    district: "강남구 압구정동",
    address: "서울 강남구 압구정로 77 지하 2층",
    intro: "노기 클래스 매일 운영. 외국인 회원 다수, 원정 환영.",
    trialPrice: 10000,
    dayPassPrice: 25000,
    monthlyPrice: 190000,
    rating: 4.8,
    reviewCount: 52,
    emoji: "🟦",
    amenities: ["운동복 대여", "수건 제공", "샤워실", "개인 락커", "주차 가능"],
    photos: [{ src: "/gyms/checkmat-1.jpg", caption: "노기 롤링" }, { src: "/gyms/checkmat-2.jpg", caption: "기술 훈련" }, { src: "/gyms/checkmat-3.jpg", caption: "오픈매트" }],
    lat: 37.5306686,
    lng: 127.0308092,
    kakaoPlaceId: null,
  },
];

// DB row(snake_case) → Gym(camelCase)
export function rowToGym(r: Record<string, unknown>): Gym {
  return {
    id: r.id as string,
    name: r.name as string,
    disciplines: (r.disciplines as Gym["disciplines"]) ?? [],
    district: r.district as string,
    address: r.address as string,
    intro: (r.intro as string) ?? "",
    trialPrice: (r.trial_price as number) ?? 0,
    dayPassPrice: (r.day_pass_price as number) ?? 0,
    monthlyPrice: (r.monthly_price as number) ?? null,
    rating: Number(r.rating ?? 0),
    reviewCount: (r.review_count as number) ?? 0,
    emoji: (r.emoji as string) ?? "🥊",
    amenities: (r.amenities as Gym["amenities"]) ?? [],
    photos: (r.photos as Gym["photos"]) ?? [],
    lat: r.lat == null ? null : Number(r.lat),
    lng: r.lng == null ? null : Number(r.lng),
    kakaoPlaceId: (r.kakao_place_id as string) ?? null,
  };
}

export function getGym(id: string): Gym | undefined {
  return MOCK_GYMS.find((g) => g.id === id);
}

export function formatPrice(price: number): string {
  return price === 0 ? "무료" : `${price.toLocaleString("ko-KR")}원`;
}

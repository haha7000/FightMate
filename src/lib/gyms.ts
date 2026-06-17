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
    photos: [{ src: "/gyms/mat.svg", caption: "매트 존" }, { src: "/gyms/class.svg", caption: "그룹 클래스" }, { src: "/gyms/shower.svg", caption: "샤워실" }, { src: "/gyms/reception.svg", caption: "리셉션" }],
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
    photos: [{ src: "/gyms/striking.svg", caption: "타격 존" }, { src: "/gyms/ring.svg", caption: "링" }, { src: "/gyms/class.svg", caption: "그룹 클래스" }, { src: "/gyms/locker.svg", caption: "락커룸" }],
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
    photos: [{ src: "/gyms/ring.svg", caption: "케이지" }, { src: "/gyms/mat.svg", caption: "매트 존" }, { src: "/gyms/striking.svg", caption: "타격 존" }, { src: "/gyms/class.svg", caption: "시합반 훈련" }, { src: "/gyms/locker.svg", caption: "락커룸" }],
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
    photos: [{ src: "/gyms/striking.svg", caption: "타격 존" }, { src: "/gyms/class.svg", caption: "그룹 클래스" }, { src: "/gyms/shower.svg", caption: "샤워실" }],
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
    photos: [{ src: "/gyms/mat.svg", caption: "매트 존" }, { src: "/gyms/class.svg", caption: "그룹 클래스" }],
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
    photos: [{ src: "/gyms/mat.svg", caption: "매트 존" }, { src: "/gyms/class.svg", caption: "노기 클래스" }, { src: "/gyms/shower.svg", caption: "샤워실" }, { src: "/gyms/locker.svg", caption: "락커룸" }, { src: "/gyms/reception.svg", caption: "리셉션" }],
  },
];

export function getGym(id: string): Gym | undefined {
  return MOCK_GYMS.find((g) => g.id === id);
}

export function formatPrice(price: number): string {
  return price === 0 ? "무료" : `${price.toLocaleString("ko-KR")}원`;
}

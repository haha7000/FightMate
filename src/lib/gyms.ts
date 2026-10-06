export type Discipline = "주짓수" | "복싱" | "MMA" | "킥복싱" | "무에타이" | "레슬링";

export const DISCIPLINES: Discipline[] = ["주짓수", "복싱", "MMA", "킥복싱", "무에타이", "레슬링"];

// 포스터·파이터 카드용 영문 표기
export const DISCIPLINE_EN: Record<Discipline, string> = {
  주짓수: "BJJ",
  복싱: "BOXING",
  MMA: "MMA",
  킥복싱: "KICKBOXING",
  무에타이: "MUAY THAI",
  레슬링: "WRESTLING",
};

export type Amenity =
  | "운동복 대여"
  | "수건 제공"
  | "샤워실"
  | "개인 락커"
  | "글러브·장비 대여"
  | "주차 가능";

export const AMENITIES: Amenity[] = [
  "운동복 대여",
  "수건 제공",
  "샤워실",
  "개인 락커",
  "글러브·장비 대여",
  "주차 가능",
];

export interface Gym {
  id: string;
  name: string;
  disciplines: Discipline[];
  district: string; // 예: 강남구 역삼동
  address: string;
  intro: string;
  trialPrice: number; // 체험 1회
  dayPassPrice: number | null; // 1일권 (null = 1일권 미운영)
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

// 1일권(드롭인) 가능 여부 — 다른 체육관 수련자가 하루 운동하러 갈 수 있는 곳
export function offersDayPass(gym: Gym): boolean {
  return gym.dayPassPrice != null;
}

// 운동복 + 수건이 다 되면 빈손으로 가도 되는 체육관
export function isHandsFree(gym: Gym): boolean {
  return gym.amenities.includes("운동복 대여") && gym.amenities.includes("수건 제공");
}

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
    dayPassPrice: r.day_pass_price == null ? null : Number(r.day_pass_price),
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




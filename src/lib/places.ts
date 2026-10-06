import { DISCIPLINES, type Discipline } from "@/lib/gyms";

// 카카오 로컬 검색 반경 상한 (m) — 지도 화면과 서버 검색이 같은 값을 쓴다
export const MAX_RADIUS_M = 20000;

// 카카오 로컬 검색으로 찾은 체육관 (아직 FightMate 미입점)
export interface Place {
  id: string; // 카카오 장소 ID
  name: string;
  category: string; // 카카오 분류의 마지막 단계 (예: "복싱,권투장")
  address: string; // 도로명 우선, 없으면 지번
  phone: string;
  lat: number;
  lng: number;
  url: string; // 카카오맵 장소 페이지
  disciplines: Discipline[];
}

// 종목별 이름·분류 키워드. 킥복싱이 복싱으로도 잡히지 않도록 복싱은 따로 처리.
const KEYWORDS: Record<Discipline, string[]> = {
  주짓수: ["주짓수", "주지츠", "jiu", "bjj", "그레이시"],
  복싱: ["복싱", "권투", "boxing"],
  MMA: ["mma", "종합격투"],
  킥복싱: ["킥복싱", "kickbox"],
  무에타이: ["무에타이", "muay"],
  레슬링: ["레슬링", "wrestl"],
};

export function detectDisciplines(text: string): Discipline[] {
  const t = text.toLowerCase();
  return DISCIPLINES.filter((d) => {
    const target = d === "복싱" ? t.replaceAll("킥복싱", "").replaceAll("kickbox", "") : t;
    return KEYWORDS[d].some((k) => target.includes(k));
  });
}

// 두 좌표 사이 거리 (m)
export function distanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const rad = (v: number) => (v * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

// 서비스 지역(대한민국) 대략 범위. 이 밖의 좌표는 검색하지 않는다 (쿼터 낭비·남용 방지).
export const KOREA_BOUNDS = { minLat: 33, maxLat: 39, minLng: 124, maxLng: 132 };

export function isInKorea(lat: number, lng: number): boolean {
  const b = KOREA_BOUNDS;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

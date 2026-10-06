import type { BookingStatus, BookingType } from "@/lib/bookings";

// 데모용 로컬 스토리지 저장소.
// TODO(M1→M2): Supabase로 교체 — 이 파일의 함수 시그니처를 유지한 채 내부만 바꾼다.

export interface Session {
  name: string;
  provider: "kakao" | "google";
}

export interface Booking {
  id: string;
  gymId: string;
  gymName: string;
  name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  type: BookingType;
  status: BookingStatus;
  createdAt: string;
}

export interface FighterProfile {
  nickname: string;
  discipline: string;
  weightClass: string;
  gymName: string;
  years: string;
  belt: string;
}

export interface Review {
  id: string;
  gymId: string;
  author: string;
  rating: number; // 1~5
  text: string;
  date: string; // YYYY-MM-DD
}

export const SESSION_STORAGE_KEY = "fm_session";

const KEYS = {
  session: SESSION_STORAGE_KEY,
  bookings: "fm_bookings",
  profile: "fm_profile",
  reviews: "fm_reviews",
} as const;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const setSession = (s: Session) => write(KEYS.session, s);
export const clearSession = () => window.localStorage.removeItem(KEYS.session);

export const getBookings = () => read<Booking[]>(KEYS.bookings) ?? [];
export function addBooking(b: Omit<Booking, "id" | "createdAt" | "status">) {
  const booking: Booking = {
    ...b,
    id: `bk-${Date.now()}`,
    status: "신청됨",
    createdAt: new Date().toISOString(),
  };
  write(KEYS.bookings, [booking, ...getBookings()]);
  return booking;
}

export const getProfile = () => read<FighterProfile>(KEYS.profile);
export const setProfile = (p: FighterProfile) => write(KEYS.profile, p);

// 시드 리뷰 — DB 연결 전까지 모든 방문자에게 동일하게 보이는 데모 데이터
const SEED_REVIEWS: Review[] = [
  {
    id: "sr-1",
    gymId: "gracie-yeoksam",
    author: "파랑띠지망생",
    rating: 5,
    text: "화이트벨트 클래스가 따로 있어서 민폐 걱정 없이 배웠어요. 관장님이 기본기를 정말 꼼꼼히 봐주십니다.",
    date: "2026-05-28",
  },
  {
    id: "sr-2",
    gymId: "gracie-yeoksam",
    author: "직장인주짓떼로",
    rating: 4,
    text: "토요일 오픈매트 분위기 좋아요. 샤워실이 조금 좁은 것만 빼면 만족.",
    date: "2026-05-12",
  },
  {
    id: "sr-3",
    gymId: "ironfist-gangnam",
    author: "복싱입문자",
    rating: 5,
    text: "새벽반 듣는데 미트 트레이닝이 진짜 시원합니다. 스트레스가 풀려요.",
    date: "2026-06-01",
  },
  {
    id: "sr-4",
    gymId: "topteam-seolleung",
    author: "아마추어3전",
    rating: 5,
    text: "시합반 커리큘럼이 체계적이에요. 대회 준비하시는 분들께 추천.",
    date: "2026-05-20",
  },
  {
    id: "sr-5",
    gymId: "muay-thai-sinsa",
    author: "무에타이N년차",
    rating: 4,
    text: "코치님 클린치 디테일이 남다릅니다. 여성 회원이 많아서 분위기도 편해요.",
    date: "2026-05-30",
  },
  {
    id: "sr-6",
    gymId: "checkmat-apgujeong",
    author: "노기러버",
    rating: 5,
    text: "노기 클래스가 매일 있는 곳이 드문데 여기가 그 곳. 외국인 회원들과 스파링하는 재미가 있습니다.",
    date: "2026-06-03",
  },
];

export function getReviews(gymId: string): Review[] {
  const local = read<Review[]>(KEYS.reviews) ?? [];
  return [...local, ...SEED_REVIEWS]
    .filter((r) => r.gymId === gymId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function addReview(r: Omit<Review, "id" | "date">) {
  const review: Review = {
    ...r,
    id: `rv-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
  };
  const local = read<Review[]>(KEYS.reviews) ?? [];
  write(KEYS.reviews, [review, ...local]);
  return review;
}

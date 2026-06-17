export type EventKind = "오픈매트" | "세미나" | "대회" | "특별수업" | "행사";

export const EVENT_KINDS: { key: EventKind; emoji: string; color: string }[] = [
  { key: "오픈매트", emoji: "🤼", color: "text-sky-300 bg-sky-950" },
  { key: "세미나", emoji: "🎓", color: "text-purple-300 bg-purple-950" },
  { key: "대회", emoji: "🏆", color: "text-amber-300 bg-amber-950" },
  { key: "특별수업", emoji: "🔥", color: "text-red-300 bg-red-950" },
  { key: "행사", emoji: "🎉", color: "text-emerald-300 bg-emerald-950" },
];

export function eventKindStyle(kind: EventKind): string {
  return EVENT_KINDS.find((k) => k.key === kind)?.color ?? "text-neutral-300 bg-neutral-800";
}

export function eventKindEmoji(kind: EventKind): string {
  return EVENT_KINDS.find((k) => k.key === kind)?.emoji ?? "📌";
}

export interface GymEvent {
  id: string;
  gymId: string;
  gymName: string; // 피드에서 체육관명 노출용 (비정규화)
  kind: EventKind;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "14:00"
  fee: number; // 참가비 (0 = 무료)
  capacity: number | null; // 정원 (null = 제한 없음)
  description: string;
  openToVisitors: boolean; // 타 체육관/외부인 참가 가능 여부
}

// TODO(M2): Supabase `events` 테이블로 교체
// 기준일: 2026-06-14 (다가오는 이벤트로 보이도록 미래 날짜 사용)
export const MOCK_EVENTS: GymEvent[] = [
  {
    id: "ev-gracie-openmat-0621",
    gymId: "gracie-yeoksam",
    gymName: "그레이시 주짓수 역삼",
    kind: "오픈매트",
    title: "토요 오픈매트 (초보 환영)",
    date: "2026-06-21",
    startTime: "14:00",
    fee: 0,
    capacity: 30,
    description:
      "매주 토요일 열리는 오픈매트입니다. 화이트벨트도 부담 없이 참여하세요. 가벼운 롤링 위주, 타 체육관 방문 환영.",
    openToVisitors: true,
  },
  {
    id: "ev-topteam-seminar-0628",
    gymId: "topteam-seolleung",
    gymName: "탑팀 MMA 선릉",
    kind: "세미나",
    title: "레슬링 테이크다운 세미나 (게스트 코치)",
    date: "2026-06-28",
    startTime: "11:00",
    fee: 30000,
    capacity: 24,
    description:
      "국가대표 출신 게스트 코치의 테이크다운 세미나. MMA·그래플러 모두 환영. 노기 복장 권장.",
    openToVisitors: true,
  },
  {
    id: "ev-checkmat-openmat-0620",
    gymId: "checkmat-apgujeong",
    gymName: "체크매트 압구정",
    kind: "오픈매트",
    title: "노기 오픈매트",
    date: "2026-06-20",
    startTime: "19:00",
    fee: 10000,
    capacity: null,
    description: "금요일 저녁 노기 오픈매트. 외국인 회원 다수, 다양한 스타일과 롤링 가능.",
    openToVisitors: true,
  },
  {
    id: "ev-ironfist-class-0619",
    gymId: "ironfist-gangnam",
    gymName: "아이언피스트 복싱 강남",
    kind: "특별수업",
    title: "초보 복싱 입문 원데이 클래스",
    date: "2026-06-19",
    startTime: "20:00",
    fee: 20000,
    capacity: 12,
    description: "스텝·잽·원투 기본기를 하루에 배우는 입문 클래스. 장비 무료 대여.",
    openToVisitors: true,
  },
  {
    id: "ev-muaythai-event-0627",
    gymId: "muay-thai-sinsa",
    gymName: "싸바이 무에타이 신사",
    kind: "행사",
    title: "와이크루 데이 + 회원 친선 스파링",
    date: "2026-06-27",
    startTime: "18:00",
    fee: 0,
    capacity: 40,
    description: "무에타이 전통 의식 와이크루 시연과 회원 친선 스파링. 관람·체험 모두 환영.",
    openToVisitors: true,
  },
  {
    id: "ev-topteam-comp-0712",
    gymId: "topteam-seolleung",
    gymName: "탑팀 MMA 선릉",
    kind: "대회",
    title: "강남 아마추어 그래플링 오픈 (체급별)",
    date: "2026-07-12",
    startTime: "10:00",
    fee: 50000,
    capacity: 128,
    description:
      "체급·벨트별 브래킷으로 진행되는 아마추어 그래플링 대회. 검증된 전적으로 기록됩니다.",
    openToVisitors: true,
  },
  {
    id: "ev-gracie-openmat-0628",
    gymId: "gracie-yeoksam",
    gymName: "그레이시 주짓수 역삼",
    kind: "오픈매트",
    title: "토요 오픈매트 (초보 환영)",
    date: "2026-06-28",
    startTime: "14:00",
    fee: 0,
    capacity: 30,
    description: "매주 토요일 오픈매트. 화이트벨트 환영, 타 체육관 방문 환영.",
    openToVisitors: true,
  },
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// 다가오는(오늘 이후) 이벤트만, 날짜 오름차순
export function upcoming(events: GymEvent[]): GymEvent[] {
  const today = todayStr();
  return [...events]
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}

export function eventsForGym(gymId: string, events: GymEvent[] = MOCK_EVENTS): GymEvent[] {
  return upcoming(events.filter((e) => e.gymId === gymId));
}

export function getEvent(id: string, events: GymEvent[] = MOCK_EVENTS): GymEvent | undefined {
  return events.find((e) => e.id === id);
}

export function formatEventDate(date: string): string {
  // "2026-06-21" → "6/21 (토)"
  const [y, m, d] = date.split("-").map(Number);
  const dow = ["일", "월", "화", "수", "목", "금", "토"][new Date(y, m - 1, d).getDay()];
  return `${m}/${d} (${dow})`;
}

export function formatFee(fee: number): string {
  return fee === 0 ? "무료" : `${fee.toLocaleString("ko-KR")}원`;
}

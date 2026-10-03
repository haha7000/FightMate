export type EventKind = "오픈매트" | "세미나" | "대회" | "특별수업" | "행사";

export const EVENT_KINDS: { key: EventKind; emoji: string; color: string }[] = [
  { key: "오픈매트", emoji: "🤼", color: "text-sky-700 bg-sky-100" },
  { key: "세미나", emoji: "🎓", color: "text-purple-700 bg-purple-100" },
  { key: "대회", emoji: "🏆", color: "text-amber-700 bg-amber-100" },
  { key: "특별수업", emoji: "🔥", color: "text-orange-700 bg-orange-100" },
  { key: "행사", emoji: "🎉", color: "text-emerald-700 bg-emerald-100" },
];

export function eventKindStyle(kind: EventKind): string {
  return EVENT_KINDS.find((k) => k.key === kind)?.color ?? "text-neutral-600 bg-neutral-100";
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
  attendees: number; // 표시 인원 = 시드 베이스라인 + 실제 RSVP 수 (capacity와 함께 "25/30" 표시)
  description: string;
  posterUrl?: string | null; // 대회·세미나 포스터 이미지 (Storage 공개 URL)
  openToVisitors: boolean; // 타 체육관/외부인 참가 가능 여부
}

// 남은 자리 (정원 무제한이면 null)
export function seatsLeft(e: GymEvent): number | null {
  if (e.capacity == null) return null;
  return Math.max(0, e.capacity - e.attendees);
}

// 마감 여부
export function isFull(e: GymEvent): boolean {
  const left = seatsLeft(e);
  return left !== null && left <= 0;
}

// 마감 임박 (남은 자리 5 이하). 무제한·마감은 false.
export function isAlmostFull(e: GymEvent): boolean {
  const left = seatsLeft(e);
  return left !== null && left > 0 && left <= 5;
}

// "YYYY-MM-DD" (로컬 날짜)
export function toYmd(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// 내일 이후 첫 번째 해당 요일(0=일 … 6=토) + weeksAhead주
function nextWeekday(dow: number, weeksAhead = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() !== dow) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + weeksAhead * 7);
  return toYmd(d);
}

// TODO(M2): Supabase `events` 테이블로 교체
// 데모 일정은 언제 열어도 "다가오는 이벤트"로 보이도록 오늘 기준 요일로 계산한다.
export const MOCK_EVENTS: GymEvent[] = [
  {
    id: "ev-gracie-openmat-0621",
    gymId: "gracie-yeoksam",
    gymName: "그레이시 주짓수 역삼",
    kind: "오픈매트",
    title: "토요 오픈매트 (초보 환영)",
    date: nextWeekday(6),
    startTime: "14:00",
    fee: 0,
    capacity: 30,
    attendees: 22,
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
    date: nextWeekday(0, 1),
    startTime: "11:00",
    fee: 30000,
    capacity: 24,
    attendees: 24,
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
    date: nextWeekday(5),
    startTime: "19:00",
    fee: 10000,
    capacity: null,
    attendees: 0,
    description: "금요일 저녁 노기 오픈매트. 외국인 회원 다수, 다양한 스타일과 롤링 가능.",
    openToVisitors: true,
  },
  {
    id: "ev-ironfist-class-0619",
    gymId: "ironfist-gangnam",
    gymName: "아이언피스트 복싱 강남",
    kind: "특별수업",
    title: "초보 복싱 입문 원데이 클래스",
    date: nextWeekday(4),
    startTime: "20:00",
    fee: 20000,
    capacity: 12,
    attendees: 11,
    description: "스텝·잽·원투 기본기를 하루에 배우는 입문 클래스. 장비 무료 대여.",
    openToVisitors: true,
  },
  {
    id: "ev-muaythai-event-0627",
    gymId: "muay-thai-sinsa",
    gymName: "싸바이 무에타이 신사",
    kind: "행사",
    title: "와이크루 데이 + 회원 친선 스파링",
    date: nextWeekday(6, 1),
    startTime: "18:00",
    fee: 0,
    capacity: 40,
    attendees: 18,
    description: "무에타이 전통 의식 와이크루 시연과 회원 친선 스파링. 관람·체험 모두 환영.",
    openToVisitors: true,
  },
  {
    id: "ev-topteam-comp-0712",
    gymId: "topteam-seolleung",
    gymName: "탑팀 MMA 선릉",
    kind: "대회",
    title: "강남 아마추어 그래플링 오픈 (체급별)",
    date: nextWeekday(0, 3),
    startTime: "10:00",
    fee: 50000,
    capacity: 128,
    attendees: 47,
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
    date: nextWeekday(6, 1),
    startTime: "14:00",
    fee: 0,
    capacity: 30,
    attendees: 9,
    description: "매주 토요일 오픈매트. 화이트벨트 환영, 타 체육관 방문 환영.",
    openToVisitors: true,
  },
];

// DB row(snake_case) → GymEvent. 표시 인원 = 베이스라인(attendees) + 실제 RSVP 수(rsvp_count).
export function rowToEvent(r: Record<string, unknown>): GymEvent {
  return {
    id: r.id as string,
    gymId: r.gym_id as string,
    gymName: r.gym_name as string,
    kind: r.kind as EventKind,
    title: r.title as string,
    date: r.date as string,
    startTime: (r.start_time as string) ?? "",
    fee: (r.fee as number) ?? 0,
    capacity: (r.capacity as number) ?? null,
    attendees: ((r.attendees as number) ?? 0) + ((r.rsvp_count as number) ?? 0),
    description: (r.description as string) ?? "",
    posterUrl: (r.poster_url as string) ?? null,
    openToVisitors: (r.open_to_visitors as boolean) ?? true,
  };
}

function todayStr(): string {
  return toYmd(new Date());
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

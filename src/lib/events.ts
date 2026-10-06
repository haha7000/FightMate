export type EventKind = "오픈매트" | "세미나" | "대회" | "특별수업" | "행사";

export const EVENT_KINDS: EventKind[] = ["오픈매트", "세미나", "대회", "특별수업", "행사"];

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

// 서비스는 한국 기준. 서버가 UTC(Vercel)여도 "오늘"은 KST로 계산한다.
export function todayKST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function todayStr(): string {
  return todayKST();
}

// 다가오는(오늘 이후) 이벤트만, 날짜 오름차순
export function upcoming(events: GymEvent[]): GymEvent[] {
  const today = todayStr();
  return [...events]
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}



export function formatEventDate(date: string): string {
  // "2026-06-21" → "6/21 (토)"
  const [y, m, d] = date.split("-").map(Number);
  const dow = ["일", "월", "화", "수", "목", "금", "토"][new Date(y, m - 1, d).getDay()];
  return `${m}/${d} (${dow})`;
}


// ── 포스터 스타일 표시용 ─────────────────────────────

export const EVENT_KIND_EN: Record<EventKind, string> = {
  오픈매트: "OPEN MAT",
  세미나: "SEMINAR",
  대회: "TOURNAMENT",
  특별수업: "CLASS",
  행사: "EVENT",
};

const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];
const DOW_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// "2026-10-10" → { m: 10, d: 10, ko: "토", en: "SAT" }
export function dateParts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { m, d, ko: DOW_KO[dow], en: DOW_EN[dow] };
}

// 이번 주(오늘~일요일) / 다음 주(다음 월~일) / 그 이후
export function weekBucket(date: string, today: string): "this" | "next" | "later" {
  const toDay = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86_400_000;
  };
  const t = toDay(today);
  const daysToSunday = 6 - ((new Date(t * 86_400_000).getUTCDay() + 6) % 7);
  const diff = toDay(date) - t;
  if (diff <= daysToSunday) return "this";
  if (diff <= daysToSunday + 7) return "next";
  return "later";
}

// Gi / No-Gi — 아직 DB 필드가 없어 제목·설명에서 추정. TODO: events에 gi_type 컬럼
export function eventGiType(e: GymEvent, gymDisciplines: string[] = []): "GI" | "NO-GI" | null {
  if (/노기|no-?gi/i.test(e.title + e.description)) return "NO-GI";
  if (e.kind === "오픈매트" && gymDisciplines.includes("주짓수")) return "GI";
  return null;
}

// 레벨 표시 — TODO: events에 level 컬럼
export function eventLevel(e: GymEvent): string | null {
  return /초보|입문|화이트벨트/.test(e.title + e.description) ? "초보 환영" : null;
}

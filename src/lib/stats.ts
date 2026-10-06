import { BOOKING_STATUSES, type BookingStatus } from "@/lib/bookings";

// 운영자 지표: 분기 목표 "체험·1일권 예약 100건"을 얼마나 채웠는지, 신청이 방문까지 이어지는지.
export const BOOKING_GOAL = 100;
const DAY = 24 * 60 * 60 * 1000;

export interface BookingStatRow {
  gym_id: string;
  gym_name: string;
  status: string;
  type: string;
  created_at: string;
}

export interface GymStat {
  gymId: string;
  gymName: string;
  total: number;
  visited: number;
}

export interface BookingStats {
  total: number; // 취소 포함 전체 신청
  active: number; // 취소 뺀 신청 (목표 집계 기준)
  last7: number;
  prev7: number; // 그 전 7일
  byStatus: Record<BookingStatus, number>;
  byType: { 체험: number; "1일권": number };
  visitRate: number | null; // 방문 완료 ÷ (취소 뺀 신청 중 결과가 난 것: 방문 완료·거절) — 결과가 없으면 null
  weekly: number[]; // 최근 8주, 오래된 주 → 이번 주
  gyms: GymStat[]; // 신청 많은 순
}

export function summarizeBookings(rows: BookingStatRow[], now = new Date()): BookingStats {
  const t = now.getTime();
  const byStatus = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0])) as Record<BookingStatus, number>;
  const byType = { 체험: 0, "1일권": 0 };
  const weekly = Array<number>(8).fill(0);
  const gyms = new Map<string, GymStat>();
  let last7 = 0;
  let prev7 = 0;

  for (const r of rows) {
    const status = (BOOKING_STATUSES as readonly string[]).includes(r.status) ? (r.status as BookingStatus) : "신청됨";
    byStatus[status] += 1;
    if (status === "취소") continue; // 취소는 지표에서 뺀다 (상태 분포에만 표시)

    if (r.type === "1일권") byType["1일권"] += 1;
    else byType.체험 += 1;

    const age = t - new Date(r.created_at).getTime();
    if (age < 7 * DAY) last7 += 1;
    else if (age < 14 * DAY) prev7 += 1;
    const week = Math.floor(age / (7 * DAY));
    if (week >= 0 && week < 8) weekly[7 - week] += 1;

    const g = gyms.get(r.gym_id) ?? { gymId: r.gym_id, gymName: r.gym_name, total: 0, visited: 0 };
    g.total += 1;
    if (status === "사용 완료") g.visited += 1;
    gyms.set(r.gym_id, g);
  }

  const decided = byStatus["사용 완료"] + byStatus["거절"];
  return {
    total: rows.length,
    active: rows.length - byStatus["취소"],
    last7,
    prev7,
    byStatus,
    byType,
    visitRate: decided > 0 ? byStatus["사용 완료"] / decided : null,
    weekly,
    gyms: [...gyms.values()].sort((a, b) => b.total - a.total || a.gymName.localeCompare(b.gymName, "ko")),
  };
}

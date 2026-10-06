import { describe, expect, it } from "vitest";
import { summarizeBookings, type BookingStatRow } from "./stats";

const now = new Date("2026-10-06T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
const row = (over: Partial<BookingStatRow> = {}): BookingStatRow => ({
  gym_id: "g1", gym_name: "그레이시", status: "신청됨", type: "체험", created_at: daysAgo(1), ...over,
});

describe("운영자 예약 지표", () => {
  it("빈 기록", () => {
    const s = summarizeBookings([], now);
    expect(s).toMatchObject({ total: 0, active: 0, last7: 0, prev7: 0, visitRate: null, gyms: [] });
    expect(s.weekly).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("목표 집계는 취소를 뺀다 (상태 분포에는 보임)", () => {
    const s = summarizeBookings([row(), row({ status: "취소" }), row({ status: "확정", type: "1일권" })], now);
    expect(s.total).toBe(3);
    expect(s.active).toBe(2);
    expect(s.byStatus.취소).toBe(1);
    expect(s.byType).toEqual({ 체험: 1, "1일권": 1 });
    expect(s.gyms).toEqual([{ gymId: "g1", gymName: "그레이시", total: 2, visited: 0 }]);
  });

  it("최근 7일 vs 그 전 7일, 8주 추이 (이번 주가 마지막 칸)", () => {
    const s = summarizeBookings(
      [row({ created_at: daysAgo(0.5) }), row({ created_at: daysAgo(6.9) }), row({ created_at: daysAgo(8) }), row({ created_at: daysAgo(70) })],
      now
    );
    expect(s.last7).toBe(2);
    expect(s.prev7).toBe(1);
    expect(s.weekly).toEqual([0, 0, 0, 0, 0, 0, 1, 2]); // 70일 전은 8주 밖
    expect(s.active).toBe(4); // 목표에는 오래된 것도 포함
  });

  it("방문 전환 = 방문 완료 ÷ (방문 완료 + 거절) — 아직 결과 없는 신청은 빼고", () => {
    const s = summarizeBookings(
      [row({ status: "사용 완료" }), row({ status: "사용 완료" }), row({ status: "사용 완료" }), row({ status: "거절" }), row({ status: "신청됨" })],
      now
    );
    expect(s.visitRate).toBe(0.75);
  });

  it("체육관별은 신청 많은 순, 방문 수 함께", () => {
    const s = summarizeBookings(
      [row({ gym_id: "a", gym_name: "가" }), row({ gym_id: "b", gym_name: "나", status: "사용 완료" }), row({ gym_id: "b", gym_name: "나" })],
      now
    );
    expect(s.gyms.map((g) => [g.gymName, g.total, g.visited])).toEqual([["나", 2, 1], ["가", 1, 0]]);
  });

  it("DB에 이상한 상태값이 있어도 깨지지 않는다", () => {
    expect(summarizeBookings([row({ status: "???" })], now).byStatus.신청됨).toBe(1);
  });
});

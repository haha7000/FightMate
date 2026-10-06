// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { summarizeBookings, type BookingStats } from "@/lib/stats";

const fetchBookingStats = vi.fn<() => Promise<BookingStats>>();
vi.mock("@/lib/partner.client", () => ({ fetchBookingStats: () => fetchBookingStats() }));
const { default: StatsPanel } = await import("./StatsPanel");

afterEach(cleanup);
const now = new Date();
const r = (status: string, days: number, gym = "그레이시") => ({
  gym_id: gym, gym_name: gym, status, type: "체험", created_at: new Date(now.getTime() - days * 86_400_000).toISOString(),
});

describe("운영자 예약 지표 카드", () => {
  it("목표 진행률·최근 7일 증감·방문 전환·체육관별", async () => {
    fetchBookingStats.mockResolvedValue(
      summarizeBookings([r("사용 완료", 1), r("거절", 2), r("신청됨", 3, "선릉 복싱"), r("확정", 9), r("취소", 1)], now)
    );
    render(<StatsPanel />);
    const bar = await screen.findByRole("progressbar", { name: "목표 진행률" });
    expect(bar.getAttribute("aria-valuenow")).toBe("4");
    expect(screen.getByText("3건")).toBeTruthy(); // 최근 7일 (취소 제외)
    expect(screen.getByText("지난주보다 +2")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy(); // 방문 1 ÷ (방문 1 + 거절 1)
    expect(screen.getByText("선릉 복싱")).toBeTruthy();
  });

  it("결과 난 신청이 없으면 전환율은 —", async () => {
    fetchBookingStats.mockResolvedValue(summarizeBookings([r("신청됨", 1)], now));
    render(<StatsPanel />);
    expect(await screen.findByText("—")).toBeTruthy();
  });

  it("불러오기 실패는 이유를 보여준다", async () => {
    fetchBookingStats.mockRejectedValue(new Error("권한 없음"));
    render(<StatsPanel />);
    expect(await screen.findByText(/지표를 불러오지 못했어요: 권한 없음/)).toBeTruthy();
  });
});

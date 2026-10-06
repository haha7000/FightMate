// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Booking } from "@/lib/store";

const cancelBooking = vi.fn(async (_id: string) => ({}) as { error?: string });
vi.mock("@/lib/data.client", () => ({ cancelBooking: (id: string) => cancelBooking(id) }));
const { default: BookingCard } = await import("./BookingCard");

const booking = (over: Partial<Booking> = {}): Booking => ({
  id: "b1", gymId: "g1", gymName: "그레이시 주짓수 역삼", name: "홍길동", phone: "010",
  date: "2099-10-10", type: "체험", status: "신청됨", createdAt: "2026-10-06", preferredTime: "저녁", ...over,
});

beforeEach(() => cancelBooking.mockClear());
afterEach(cleanup);

describe("내 예약 카드", () => {
  it("희망 시간대와 '확인 중' 상태를 보여준다", () => {
    render(<BookingCard booking={booking()} />);
    expect(screen.getByText(/2099-10-10 저녁/)).toBeTruthy();
    expect(screen.getByText("확인 중")).toBeTruthy();
  });

  it("취소는 확인 시트를 거친다 — 닫으면 아무 일 없음", async () => {
    const user = userEvent.setup();
    render(<BookingCard booking={booking()} />);
    await user.click(screen.getByRole("button", { name: "신청 취소" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "닫기" }));
    expect(cancelBooking).not.toHaveBeenCalled();
  });

  it("취소하면 상태가 '취소'로 바뀌고 QR·취소 버튼이 사라진다", async () => {
    const user = userEvent.setup();
    render(<BookingCard booking={booking({ status: "확정" })} />);
    await user.click(screen.getByRole("button", { name: "신청 취소" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "취소하기" }));
    expect(cancelBooking).toHaveBeenCalledWith("b1");
    expect(await screen.findByText("취소")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "신청 취소" })).toBeNull();
    expect(screen.queryByRole("button", { name: /입장 QR/ })).toBeNull();
  });

  it("취소할 수 없으면 이유를 보여주고 상태는 그대로", async () => {
    cancelBooking.mockResolvedValueOnce({ error: "이미 처리된 신청이라 취소할 수 없어요" });
    const user = userEvent.setup();
    render(<BookingCard booking={booking()} />);
    await user.click(screen.getByRole("button", { name: "신청 취소" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "취소하기" }));
    expect(await screen.findByText("이미 처리된 신청이라 취소할 수 없어요")).toBeTruthy();
    expect(screen.getByText("확인 중")).toBeTruthy();
  });

  it.each(["거절", "사용 완료", "취소"] as const)("'%s' 신청은 취소 버튼이 없다", (status) => {
    render(<BookingCard booking={booking({ status })} />);
    expect(screen.queryByRole("button", { name: "신청 취소" })).toBeNull();
  });

  it("거절된 신청엔 다른 날짜로 다시 신청 링크", () => {
    render(<BookingCard booking={booking({ status: "거절" })} />);
    expect(screen.getByRole("link", { name: "다른 날짜로 다시 신청하기" }).getAttribute("href")).toBe("/gym/g1");
  });
});

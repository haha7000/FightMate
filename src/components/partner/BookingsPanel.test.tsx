// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GymBooking } from "@/lib/partner.client";

const api = {
  fetchGymBookings: vi.fn<(gymId: string) => Promise<GymBooking[]>>(),
  setBookingStatus: vi.fn(async (_id: string, _status: string) => {}),
  fetchNotify: vi.fn(async () => ({ phone: "01011112222", enabled: true })),
  saveNotify: vi.fn(async () => {}),
  sendNotifyTest: vi.fn(async () => {}),
};
vi.mock("@/lib/partner.client", () => api);
const { default: BookingsPanel } = await import("./BookingsPanel");

const booking = (over: Partial<GymBooking>): GymBooking => ({
  id: "b1", name: "홍길동", phone: "010-1234-5678", date: "2026-10-10", type: "체험",
  status: "신청됨", createdAt: "2026-10-06T01:00:00Z", statusChangedAt: null, ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchNotify.mockResolvedValue({ phone: "01011112222", enabled: true });
});
afterEach(cleanup);

async function setup(list: GymBooking[]) {
  api.fetchGymBookings.mockResolvedValue(list);
  const user = userEvent.setup();
  render(<BookingsPanel gymId="g1" gymName="그레이시 주짓수 역삼" />);
  await waitFor(() => expect(screen.queryByText("불러오는 중…")).toBeNull()); // 목록 로딩 끝
  return user;
}

describe("관장 모드 신청 탭", () => {
  it("거절은 바로 처리하지 않고 확인 시트를 띄운다 — 취소하면 아무 일 없음", async () => {
    const user = await setup([booking({})]);
    await user.click(screen.getByRole("button", { name: "거절" }));
    const sheet = screen.getByRole("dialog");
    expect(within(sheet).getByText("홍길동님의 신청을 거절할까요?")).toBeTruthy();
    await user.click(within(sheet).getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(api.setBookingStatus).not.toHaveBeenCalled();
  });

  it("확인하면 거절되고 지난 내역으로 옮겨진다", async () => {
    const user = await setup([booking({})]);
    await user.click(screen.getByRole("button", { name: "거절" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "거절하기" }));
    expect(api.setBookingStatus).toHaveBeenCalledWith("b1", "거절");
    expect(await screen.findByText("새로 들어온 신청이 없어요")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /지난 내역/ }));
    expect(screen.getByText("홍길동")).toBeTruthy();
  });

  it("지난 내역의 거절 신청: '자리 났어요' 문자에 체육관·날짜가 미리 채워진다", async () => {
    const user = await setup([booking({ status: "거절", statusChangedAt: "2026-10-06T05:00:00Z" })]);
    await user.click(screen.getByRole("button", { name: /지난 내역/ }));
    const link = screen.getByRole("link", { name: /자리 났어요 문자 보내기/ });
    const href = decodeURIComponent(link.getAttribute("href")!);
    expect(href).toMatch(/^sms:010-1234-5678[?&]body=/);
    expect(href).toContain("그레이시 주짓수 역삼");
    expect(href).toContain("10/10 체험");
  });

  it("거절했던 신청을 다시 확정할 때도 확인을 거친다", async () => {
    const user = await setup([booking({ status: "거절" })]);
    await user.click(screen.getByRole("button", { name: /지난 내역/ }));
    await user.click(screen.getByRole("button", { name: /확정으로 바꾸기/ }));
    expect(api.setBookingStatus).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "확정으로 바꾸기" }));
    expect(api.setBookingStatus).toHaveBeenCalledWith("b1", "확정");
  });

  it("저장에 실패하면 화면을 원래대로 되돌리고 이유를 보여준다", async () => {
    api.setBookingStatus.mockRejectedValueOnce(new Error("권한이 없어요"));
    const user = await setup([booking({})]);
    await user.click(screen.getByRole("button", { name: "확정하기" }));
    expect(await screen.findByText("권한이 없어요")).toBeTruthy();
    expect(screen.getByRole("button", { name: "확정하기" })).toBeTruthy(); // 여전히 새 신청에 있음
  });
});

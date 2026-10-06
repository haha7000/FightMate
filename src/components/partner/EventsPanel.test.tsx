// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MOCK_GYMS } from "@/lib/mock-data";
import type { GymEvent } from "@/lib/events";

const api = {
  fetchGymEvents: vi.fn<(gymId: string) => Promise<GymEvent[]>>(),
  updateEvent: vi.fn(async (_id: string, _f: unknown) => ({ ok: true }) as { ok: boolean; error?: string }),
  createEvent: vi.fn(),
  deleteEventById: vi.fn(),
  fetchEventRoster: vi.fn(async () => []),
  uploadEventPoster: vi.fn(),
};
vi.mock("@/lib/data.client", () => api);
const { default: EventsPanel } = await import("./EventsPanel");

const event = (over: Partial<GymEvent> = {}): GymEvent => ({
  id: "ev1", gymId: MOCK_GYMS[0].id, gymName: MOCK_GYMS[0].name, kind: "오픈매트", title: "토요 오픈매트",
  date: "2099-10-10", startTime: "14:00", fee: 0, capacity: 20, attendees: 5, description: "노기",
  posterUrl: null, openToVisitors: true, ...over,
});

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

async function setup(list: GymEvent[]) {
  api.fetchGymEvents.mockResolvedValue(list);
  const user = userEvent.setup();
  render(<EventsPanel gym={MOCK_GYMS[0]} />);
  await waitFor(() => expect(screen.queryByText("불러오는 중…")).toBeNull());
  return user;
}

describe("관장 모드 일정 수정", () => {
  it("수정 폼은 기존 값으로 채워지고, 저장하면 목록에 바로 반영", async () => {
    const user = await setup([event()]);
    await user.click(screen.getByRole("button", { name: "수정" }));
    const title = screen.getByDisplayValue("토요 오픈매트");
    await user.clear(title);
    await user.type(title, "일요 오픈매트");
    await user.click(screen.getByRole("button", { name: "수정 저장" }));
    expect(api.updateEvent).toHaveBeenCalledWith("ev1", expect.objectContaining({ title: "일요 오픈매트", capacity: 20, kind: "오픈매트" }));
    expect(await screen.findByText("일요 오픈매트")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "수정 저장" })).toBeNull();
  });

  it("이미 신청한 인원보다 정원을 줄이면 막는다", async () => {
    const user = await setup([event({ attendees: 12 })]);
    await user.click(screen.getByRole("button", { name: "수정" }));
    const cap = screen.getByDisplayValue("20");
    await user.clear(cap);
    await user.type(cap, "10");
    await user.click(screen.getByRole("button", { name: "수정 저장" }));
    expect(screen.getByText(/이미 12명이 신청했어요/)).toBeTruthy();
    expect(api.updateEvent).not.toHaveBeenCalled();
  });

  it("저장 실패는 폼을 유지하고 이유를 보여준다", async () => {
    api.updateEvent.mockResolvedValueOnce({ ok: false, error: "permission denied" });
    const user = await setup([event()]);
    await user.click(screen.getByRole("button", { name: "수정" }));
    await user.click(screen.getByRole("button", { name: "수정 저장" }));
    expect(await screen.findByText(/수정하지 못했어요: permission denied/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "수정 저장" })).toBeTruthy();
  });

  it("취소하면 원래 카드로", async () => {
    const user = await setup([event()]);
    await user.click(screen.getByRole("button", { name: "수정" }));
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.getByText("토요 오픈매트")).toBeTruthy();
    expect(api.updateEvent).not.toHaveBeenCalled();
  });
});

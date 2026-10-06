// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { NotifySetting } from "@/lib/partner.client";

const api = {
  fetchNotify: vi.fn<(gymId: string) => Promise<NotifySetting | null>>(),
  saveNotify: vi.fn(async (_gymId: string, _s: NotifySetting) => {}),
  sendNotifyTest: vi.fn(async (_gymId: string) => {}),
};
vi.mock("@/lib/partner.client", () => api);
const { default: NotifyCard } = await import("./NotifyCard");

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("관장 모드 알림 번호 카드", () => {
  it("처음엔 번호 등록 화면, 휴대폰이 아니면 저장하지 않고 안내", async () => {
    api.fetchNotify.mockResolvedValue(null);
    const user = userEvent.setup();
    render(<NotifyCard gymId="g1" />);
    await user.type(await screen.findByPlaceholderText("010-0000-0000"), "02-123-4567");
    await user.click(screen.getByRole("button", { name: "등록" }));
    expect(screen.getByText(/휴대폰 번호를 확인해주세요/)).toBeTruthy();
    expect(api.saveNotify).not.toHaveBeenCalled();
  });

  it("휴대폰 번호면 저장하고 하이픈 넣어 보여준다", async () => {
    api.fetchNotify.mockResolvedValue(null);
    const user = userEvent.setup();
    render(<NotifyCard gymId="g1" />);
    await user.type(await screen.findByPlaceholderText("010-0000-0000"), "01011112222");
    await user.click(screen.getByRole("button", { name: "등록" }));
    expect(api.saveNotify).toHaveBeenCalledWith("g1", { phone: "01011112222", enabled: true });
    expect(await screen.findByText("010-1111-2222")).toBeTruthy();
  });

  it("알림을 끄면 저장되고, 꺼진 동안 테스트 문자는 못 보낸다", async () => {
    api.fetchNotify.mockResolvedValue({ phone: "01011112222", enabled: true });
    const user = userEvent.setup();
    render(<NotifyCard gymId="g1" />);
    await user.click(await screen.findByRole("checkbox"));
    expect(api.saveNotify).toHaveBeenCalledWith("g1", { phone: "01011112222", enabled: false });
    expect((screen.getByRole("button", { name: "테스트 문자 보내기" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("테스트 문자 실패 이유를 보여준다", async () => {
    api.fetchNotify.mockResolvedValue({ phone: "01011112222", enabled: true });
    api.sendNotifyTest.mockRejectedValueOnce(new Error("아직 문자 발송 설정 전이에요"));
    const user = userEvent.setup();
    render(<NotifyCard gymId="g1" />);
    await user.click(await screen.findByRole("button", { name: "테스트 문자 보내기" }));
    expect(await screen.findByText("아직 문자 발송 설정 전이에요")).toBeTruthy();
  });
});

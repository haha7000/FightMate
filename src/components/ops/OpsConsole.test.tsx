// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MOCK_GYMS } from "@/lib/mock-data";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const api = {
  createInvite: vi.fn(async () => "tok123456"),
  fetchGymRequests: vi.fn(async () => []),
  fetchMemberCounts: vi.fn(async () => ({ [MOCK_GYMS[0].id]: 1 })),
  fetchGymMembers: vi.fn(async () => [{ userId: "u1", role: "owner", nickname: "김관장", since: "2026-10-01T00:00:00Z" }]),
  fetchPendingInvites: vi.fn(async () => [{ token: "abcdef123456", role: "owner", expiresAt: "2026-10-20T00:00:00Z" }]),
  removeGymMember: vi.fn(async () => {}),
  revokeInvite: vi.fn(async () => {}),
  setGymPublished: vi.fn(async () => {}),
  fetchBookingStats: vi.fn(() => new Promise(() => {})), // 지표는 StatsPanel 테스트에서
  fetchPartnerApplications: vi.fn(async () => [] as unknown[]),
  setPartnerApplicationDone: vi.fn(async () => {}),
};
vi.mock("@/lib/partner.client", () => api);
const { default: OpsConsole } = await import("./OpsConsole");

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function setup(gyms = [MOCK_GYMS[0]]) {
  const user = userEvent.setup();
  render(<OpsConsole gyms={gyms} />);
  return user;
}

describe("운영자 화면", () => {
  it("숨기기는 확인 시트를 거쳐서, 숨기면 배지가 붙고 다시 공개 가능", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "손님에게 숨기기" }));
    expect(api.setGymPublished).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "숨기기" }));
    expect(api.setGymPublished).toHaveBeenCalledWith(MOCK_GYMS[0].id, false);
    expect(await screen.findByText("숨김")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "다시 공개" }));
    expect(api.setGymPublished).toHaveBeenLastCalledWith(MOCK_GYMS[0].id, true);
    await waitFor(() => expect(screen.queryByText("숨김")).toBeNull());
  });

  it("숨긴 체육관은 처음부터 배지와 '다시 공개'", () => {
    setup([{ ...MOCK_GYMS[0], isPublished: false }]);
    expect(screen.getByText("숨김")).toBeTruthy();
    expect(screen.getByRole("button", { name: "다시 공개" })).toBeTruthy();
  });

  it("관장 연결 해제 → 확인 후 목록과 관장 수가 줄어든다", async () => {
    const user = setup();
    expect(await screen.findByText("관장 1명")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /관장·초대 관리/ }));
    expect(await screen.findByText("김관장")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "연결 해제" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "연결 해제" }));
    expect(api.removeGymMember).toHaveBeenCalledWith(MOCK_GYMS[0].id, "u1");
    await waitFor(() => expect(screen.queryByText("김관장")).toBeNull());
    expect(screen.getByText("관장 없음")).toBeTruthy();
  });

  it("사용 전 초대 링크를 취소할 수 있다", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: /관장·초대 관리/ }));
    expect(await screen.findByText(/…123456/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "초대 취소" }));
    expect(api.revokeInvite).toHaveBeenCalledWith("abcdef123456");
    await waitFor(() => expect(screen.queryByText(/…123456/)).toBeNull());
  });
});

describe("운영자 화면 — 관장 입점 신청", () => {
  const app = (over = {}) => ({
    id: "a1", gymName: "선릉 복싱", address: "서울 강남구 선릉로 1", ownerName: "김관장", phone: "01011112222",
    message: "저녁에 연락 주세요", done: false, createdAt: "2026-10-06T01:00:00Z", ...over,
  });

  it("새 신청 수 배지, 전화 링크, 남긴 말", async () => {
    api.fetchPartnerApplications.mockResolvedValue([app(), app({ id: "a2", gymName: "끝난 곳", phone: "0212345678", message: "", done: true })]);
    setup();
    expect(await screen.findByText("선릉 복싱")).toBeTruthy();
    const heading = screen.getByRole("heading", { name: /관장 입점 신청/ });
    expect(within(heading).getByText("1")).toBeTruthy();
    expect(screen.getByRole("link", { name: "010-1111-2222" }).getAttribute("href")).toBe("tel:01011112222");
    expect(screen.getByText("저녁에 연락 주세요")).toBeTruthy();
  });

  it("처리 완료 → 저장하고 배지가 사라진다", async () => {
    api.fetchPartnerApplications.mockResolvedValue([app()]);
    const user = setup();
    await user.click(await screen.findByRole("button", { name: "처리 완료" }));
    expect(api.setPartnerApplicationDone).toHaveBeenCalledWith("a1", true);
    expect(await screen.findByRole("button", { name: "다시 열기" })).toBeTruthy();
    expect(within(screen.getByRole("heading", { name: /관장 입점 신청/ })).queryByText("1")).toBeNull();
  });

  it("이 정보로 등록 → 등록 폼에 이름·주소가 채워진다", async () => {
    window.scrollTo = vi.fn();
    api.fetchPartnerApplications.mockResolvedValue([app()]);
    const user = setup();
    await user.click(await screen.findByRole("button", { name: /이 정보로 등록/ }));
    expect(screen.getByDisplayValue("선릉 복싱")).toBeTruthy();
    expect(screen.getByDisplayValue("서울 강남구 선릉로 1")).toBeTruthy();
  });
});

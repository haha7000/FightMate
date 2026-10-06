// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FighterProfile } from "@/lib/store";

const data = {
  fetchProfile: vi.fn<() => Promise<FighterProfile | null>>(),
  fetchMyFighterPath: vi.fn<() => Promise<string | null>>(),
  saveProfile: vi.fn(async (_p: FighterProfile) => {}),
};
vi.mock("@/lib/data.client", () => data);
vi.mock("@/lib/partner.client", () => ({ fetchMyRoles: async () => ({ isAdmin: false, gymCount: 0 }) }));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: { name: "철수", provider: "kakao" }, signOut: vi.fn() }) }));
vi.mock("@/components/AccountDelete", () => ({ default: () => null }));
vi.mock("qrcode", () => ({ default: { toDataURL: vi.fn(async (url: string) => `data:qr,${url}`) } }));
const { default: CardPage } = await import("./page");

const profile: FighterProfile = { nickname: "철수", discipline: "복싱", weightClass: "", gymName: "", years: "", belt: "해당 없음" };

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("내 파이터 카드 — 프로필 QR", () => {
  it("저장된 프로필이 있으면 카드에 내 공개 프로필 QR이 들어간다", async () => {
    data.fetchProfile.mockResolvedValue(profile);
    data.fetchMyFighterPath.mockResolvedValue("/fighter/u1");
    render(<CardPage />);
    const qr = (await screen.findByAltText("프로필 QR")) as HTMLImageElement;
    expect(qr.src).toBe(`data:qr,${window.location.origin}/fighter/u1`);
    expect(screen.getByRole("link", { name: "내 공개 프로필" }).getAttribute("href")).toBe(`${window.location.origin}/fighter/u1`);
  });

  it("아직 저장 전이면 QR 없이 안내, 저장하면 QR이 생긴다", async () => {
    data.fetchProfile.mockResolvedValue(null);
    data.fetchMyFighterPath.mockResolvedValue("/fighter/u1");
    const user = userEvent.setup();
    render(<CardPage />);
    await user.type(screen.getByPlaceholderText("링네임 또는 닉네임"), "영희");
    expect(screen.getByText(/프로필을 저장하면 카드에 내 프로필 QR이 들어가요/)).toBeTruthy();
    expect(screen.queryByAltText("프로필 QR")).toBeNull();
    await user.click(screen.getByRole("button", { name: "프로필 저장" }));
    expect(data.saveProfile).toHaveBeenCalledWith(expect.objectContaining({ nickname: "영희" }));
    expect(await screen.findByAltText("프로필 QR")).toBeTruthy();
  });
});

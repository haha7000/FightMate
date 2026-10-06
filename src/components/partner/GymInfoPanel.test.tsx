// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MOCK_GYMS } from "@/lib/mock-data";
import type { Gym } from "@/lib/gyms";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const saveGym = vi.fn(async (_g: Gym) => {});
vi.mock("@/lib/partner.client", () => ({ saveGym: (g: Gym) => saveGym(g), uploadGymPhoto: vi.fn() }));
const { default: GymInfoPanel } = await import("./GymInfoPanel");

beforeEach(() => saveGym.mockClear());
afterEach(cleanup);

describe("관장 모드 체육관 정보", () => {
  it("전화번호·운영시간을 저장한다", async () => {
    const user = userEvent.setup();
    render(<GymInfoPanel gym={{ ...MOCK_GYMS[0], phone: null, hours: null }} />);
    await user.type(screen.getByPlaceholderText("02-123-4567"), "02-555-1234");
    await user.type(screen.getByPlaceholderText(/평일 07:00/), "평일 07:00 – 23:00");
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(saveGym).toHaveBeenCalledWith(expect.objectContaining({ phone: "02-555-1234", hours: "평일 07:00 – 23:00" }));
    expect(await screen.findByText(/저장했어요/)).toBeTruthy();
  });

  it("전화번호 형식이 이상하면 저장하지 않고 안내", async () => {
    const user = userEvent.setup();
    render(<GymInfoPanel gym={{ ...MOCK_GYMS[0], phone: null }} />);
    await user.type(screen.getByPlaceholderText("02-123-4567"), "전화주세요");
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByText(/전화번호를 확인해주세요/)).toBeTruthy();
    expect(saveGym).not.toHaveBeenCalled();
  });

  it("1일권을 끄면 가격 없이(미운영) 저장", async () => {
    const user = userEvent.setup();
    render(<GymInfoPanel gym={{ ...MOCK_GYMS[0], dayPassPrice: 20000 }} />);
    const toggle = screen.getAllByRole("checkbox")[0];
    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(saveGym).toHaveBeenCalledWith(expect.objectContaining({ dayPassPrice: null }));
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { FighterProfile } from "@/lib/store";

const getFighterProfile = vi.fn<(id: string) => Promise<FighterProfile | null>>();
vi.mock("@/lib/data.server", () => ({ getFighterProfile: (id: string) => getFighterProfile(id) }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
const { default: FighterPage, generateMetadata } = await import("./[id]/page");

afterEach(cleanup);
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const profile: FighterProfile = { nickname: "철수", discipline: "복싱", weightClass: "-70kg", gymName: "선릉 복싱", years: "2", belt: "해당 없음" };

describe("공개 파이터 프로필 (/fighter/[id])", () => {
  it("카드 내용과 가입 유도 버튼을 보여준다", async () => {
    getFighterProfile.mockResolvedValue(profile);
    render(await FighterPage(params("u1")));
    expect(screen.getByText("철수")).toBeTruthy();
    expect(screen.getByText("BOXING")).toBeTruthy();
    expect(screen.getByText("선릉 복싱")).toBeTruthy();
    expect(screen.getByRole("link", { name: "체육관 둘러보기" }).getAttribute("href")).toBe("/");
  });

  it("없는 프로필은 404", async () => {
    getFighterProfile.mockResolvedValue(null);
    await expect(FighterPage(params("nope"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("검색엔진에는 올리지 않는다", async () => {
    getFighterProfile.mockResolvedValue(profile);
    const meta = await generateMetadata(params("u1"));
    expect(meta.title).toContain("철수");
    expect(meta.robots).toEqual({ index: false });
  });
});

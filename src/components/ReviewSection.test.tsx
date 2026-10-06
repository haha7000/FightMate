// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let auth: { user: { name: string } | null; loading: boolean } = { user: null, loading: false };
vi.mock("@/lib/auth", () => ({ useAuth: () => auth }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));
vi.mock("next/navigation", () => ({ usePathname: () => "/gym/g1" }));
const api = {
  fetchReviews: vi.fn(async (_gymId: string) => [] as unknown[]),
  fetchCanReview: vi.fn(async (_gymId: string) => false),
  submitReview: vi.fn(async (_input: unknown) => ({}) as { error?: string }),
};
vi.mock("@/lib/data.client", () => api);
const { default: ReviewSection } = await import("./ReviewSection");

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("체육관 리뷰", () => {
  it("비로그인: 로그인 후 이 페이지로 돌아오는 링크", async () => {
    auth = { user: null, loading: false };
    render(<ReviewSection gymId="g1" />);
    const link = await screen.findByRole("link", { name: "로그인하고 리뷰 쓰기" });
    expect(link.getAttribute("href")).toBe("/login?next=%2Fgym%2Fg1");
  });

  it("로그인했지만 방문 전: 쓰기 버튼 대신 안내", async () => {
    auth = { user: { name: "홍길동" }, loading: false };
    api.fetchCanReview.mockResolvedValue(false);
    render(<ReviewSection gymId="g1" />);
    expect(await screen.findByText("방문 후 리뷰를 쓸 수 있어요")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "리뷰 쓰기" })).toBeNull();
  });

  it("방문 완료: 쓰고 등록하면 목록을 다시 불러온다", async () => {
    auth = { user: { name: "홍길동" }, loading: false };
    api.fetchCanReview.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<ReviewSection gymId="g1" />);
    await user.click(await screen.findByRole("button", { name: "리뷰 쓰기" }));
    await user.type(screen.getByPlaceholderText(/체험은 어땠나요/), "관장님이 친절해요");
    await user.click(screen.getByRole("button", { name: "등록" }));
    expect(api.submitReview).toHaveBeenCalledWith({ gymId: "g1", author: "홍길동", rating: 5, text: "관장님이 친절해요" });
    expect(api.fetchReviews).toHaveBeenCalledTimes(2);
  });

  it("저장 실패 이유를 보여주고 입력 내용은 지우지 않는다", async () => {
    auth = { user: { name: "홍길동" }, loading: false };
    api.fetchCanReview.mockResolvedValue(true);
    api.submitReview.mockResolvedValueOnce({ error: "방문을 마친 체육관에만 리뷰를 쓸 수 있어요" });
    const user = userEvent.setup();
    render(<ReviewSection gymId="g1" />);
    await user.click(await screen.findByRole("button", { name: "리뷰 쓰기" }));
    const box = screen.getByPlaceholderText(/체험은 어땠나요/) as HTMLTextAreaElement;
    await user.type(box, "좋아요");
    await user.click(screen.getByRole("button", { name: "등록" }));
    expect(await screen.findByText("방문을 마친 체육관에만 리뷰를 쓸 수 있어요")).toBeTruthy();
    expect(box.value).toBe("좋아요");
  });
});

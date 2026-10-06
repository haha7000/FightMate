import { describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "@/test/fake-supabase";

let sb = fakeSupabase({});
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => sb.client }));
const { fetchCanReview, submitReview } = await import("./data.client");

const input = { gymId: "g1", author: "홍길동", rating: 5, text: "좋아요" };

describe("리뷰 작성 자격·저장", () => {
  it("방문 완료한 내 신청이 있어야 작성 가능", async () => {
    sb = fakeSupabase({ user: { id: "u1" }, responses: { "bookings.select": { data: [{ id: "b1" }] } } });
    expect(await fetchCanReview("g1")).toBe(true);
    expect(sb.calls[0].filters).toEqual([
      ["eq", ["gym_id", "g1"]],
      ["eq", ["user_id", "u1"]],
      ["eq", ["status", "사용 완료"]],
    ]);
    sb = fakeSupabase({ user: { id: "u1" }, responses: { "bookings.select": { data: [] } } });
    expect(await fetchCanReview("g1")).toBe(false);
  });

  it("비로그인은 작성 불가", async () => {
    sb = fakeSupabase({ user: null });
    expect(await fetchCanReview("g1")).toBe(false);
  });

  it("DB 정책 거부는 이해할 수 있는 문장으로", async () => {
    sb = fakeSupabase({ user: { id: "u1" }, responses: { "reviews.insert": { error: { message: "new row violates row-level security policy", code: "42501" } } } });
    expect(await submitReview(input)).toEqual({ error: "방문을 마친 체육관에만 리뷰를 쓸 수 있어요" });
  });

  it("성공하면 본인 명의로 저장", async () => {
    sb = fakeSupabase({ user: { id: "u1" } });
    expect(await submitReview(input)).toEqual({});
    expect(sb.calls[0].args[0]).toMatchObject({ gym_id: "g1", user_id: "u1", rating: 5 });
  });
});

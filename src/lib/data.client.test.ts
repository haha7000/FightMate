import { describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "@/test/fake-supabase";

let sb = fakeSupabase({});
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => sb.client }));
const { cancelBooking, fetchCanReview, fetchMyEvents, submitReview } = await import("./data.client");

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

describe("손님 신청 취소", () => {
  it("본인 취소 함수를 신청 ID로 부른다", async () => {
    sb = fakeSupabase({});
    expect(await cancelBooking("b1")).toEqual({});
    expect(sb.rpcCalls).toEqual([{ fn: "cancel_my_booking", args: { bid: "b1" } }]);
  });
  it("이미 처리된 신청은 안내 문구로", async () => {
    sb = fakeSupabase({ rpc: { cancel_my_booking: { error: { message: "P0001: cannot_cancel" } } } });
    expect(await cancelBooking("b1")).toEqual({ error: "이미 처리된 신청이라 취소할 수 없어요" });
  });
});

describe("내가 신청한 이벤트", () => {
  const ev = (id: string, date: string) => ({
    events: {
      id, gym_id: "g1", gym_name: "체육관", kind: "오픈매트", title: id, date, start_time: "14:00", fee: 0,
      capacity: null, attendees: 0, rsvp_count: 0, description: "", poster_url: null, open_to_visitors: true, created_at: "",
    },
  });
  it("지난 이벤트는 빼고 날짜순, 지워진 이벤트는 무시", async () => {
    sb = fakeSupabase({
      user: { id: "u1" },
      responses: { "event_rsvps.select": { data: [ev("later", "2099-12-01"), ev("past", "2000-01-01"), { events: null }, ev("sooner", "2099-11-01")] } },
    });
    expect((await fetchMyEvents()).map((e) => e.id)).toEqual(["sooner", "later"]);
    expect(sb.calls[0].filters).toEqual([["eq", ["user_id", "u1"]]]);
  });
  it("비로그인이면 빈 목록", async () => {
    sb = fakeSupabase({ user: null });
    expect(await fetchMyEvents()).toEqual([]);
  });
});

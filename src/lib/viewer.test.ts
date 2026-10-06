import { describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "@/test/fake-supabase";

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
const { getViewer } = await import("./viewer");

const gymRow = {
  id: "g1", name: "그레이시", disciplines: ["주짓수"], district: "강남구 역삼동", address: "주소", intro: "",
  trial_price: 0, day_pass_price: 20000, monthly_price: null, rating: 4.8, review_count: 1, emoji: "",
  amenities: [], photos: [], owner_id: null, lat: null, lng: null, kakao_place_id: null, created_at: "",
};

describe("getViewer — 로그인 사용자의 역할", () => {
  it("비로그인이면 null", async () => {
    createClient.mockResolvedValue(fakeSupabase({ user: null }).client);
    expect(await getViewer()).toBeNull();
  });

  it("운영자 여부와 연결된 체육관(관장·코치)", async () => {
    createClient.mockResolvedValue(
      fakeSupabase({
        user: { id: "u1", user_metadata: { nickname: "관장님" } },
        responses: {
          "admins.select": { data: { user_id: "u1" } },
          "gym_members.select": {
            data: [
              { role: "coach", gyms: gymRow },
              { role: "owner", gyms: null }, // 체육관이 지워진 연결은 무시
            ],
          },
        },
      }).client
    );
    const v = await getViewer();
    expect(v).toMatchObject({ userId: "u1", name: "관장님", isAdmin: true });
    expect(v!.memberships).toHaveLength(1);
    expect(v!.memberships[0]).toMatchObject({ role: "coach", gym: { id: "g1", dayPassPrice: 20000 } });
  });

  it("역할 테이블 조회가 실패해도(마이그레이션 전) 역할 없는 회원으로", async () => {
    createClient.mockResolvedValue(
      fakeSupabase({
        user: { id: "u1" },
        responses: {
          "admins.select": { error: { message: "relation does not exist" } },
          "gym_members.select": { error: { message: "relation does not exist" } },
        },
      }).client
    );
    expect(await getViewer()).toMatchObject({ isAdmin: false, memberships: [], name: "회원" });
  });
});

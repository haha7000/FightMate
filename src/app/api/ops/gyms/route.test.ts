import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, jsonRequest } from "@/test/fake-supabase";

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
const { POST } = await import("./route");

const URL_ = "http://localhost:3000/api/ops/gyms";
const body = { name: " 새 체육관 ", address: "서울 강남구 테헤란로 123", disciplines: ["주짓수", "요가"], trialPrice: 0, dayPassPrice: 20000.4 };
const admin = (extra = {}) =>
  fakeSupabase({ user: { id: "admin1" }, responses: { "admins.select": { data: { user_id: "admin1" } }, ...extra } });

// 카카오 주소 검색 응답 흉내
function stubGeocode(docs: unknown[]) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ documents: docs }))));
}

beforeEach(() => vi.stubEnv("KAKAO_REST_API_KEY", "test-key"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/ops/gyms — 운영자 체육관 등록", () => {
  it("운영자가 아니면 403", async () => {
    createClient.mockResolvedValue(fakeSupabase({ user: { id: "u1" }, responses: { "admins.select": { data: null } } }).client);
    expect((await POST(jsonRequest(URL_, body))).status).toBe(403);
  });

  it("허용된 종목이 하나도 없으면 400", async () => {
    createClient.mockResolvedValue(admin().client);
    expect((await POST(jsonRequest(URL_, { ...body, disciplines: ["요가"] }))).status).toBe(400);
  });

  it("주소로 위치를 못 찾으면 422, 저장하지 않음", async () => {
    stubGeocode([]);
    const sb = admin();
    createClient.mockResolvedValue(sb.client);
    expect((await POST(jsonRequest(URL_, body))).status).toBe(422);
    expect(sb.calls.find((c) => c.op === "insert")).toBeUndefined();
  });

  it("좌표·동네를 채우고 값 정리해서 저장", async () => {
    stubGeocode([
      { x: "127.0313", y: "37.4995", address: { region_2depth_name: "강남구", region_3depth_name: "역삼동" }, road_address: null },
    ]);
    const sb = admin();
    createClient.mockResolvedValue(sb.client);
    const res = await POST(jsonRequest(URL_, body));
    expect(res.status).toBe(200);
    const row = sb.calls.find((c) => c.table === "gyms" && c.op === "insert")!.args[0] as Record<string, unknown>;
    expect(row).toMatchObject({
      name: "새 체육관",
      district: "강남구 역삼동",
      lat: 37.4995,
      lng: 127.0313,
      disciplines: ["주짓수"], // 요가 제거
      trial_price: 0,
      day_pass_price: 20000, // 반올림
    });
    expect(row.id).toMatch(/^g-/);
  });
});

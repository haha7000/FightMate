import { describe, expect, it, vi } from "vitest";
import { fakeSupabase, jsonRequest } from "@/test/fake-supabase";

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
const { POST } = await import("./route");

const URL_ = "http://localhost:3000/api/gym-requests";
const valid = { placeId: "1234567890", name: " 펀짐 ", address: "서울 강남구", phone: "02-000-0000" };

describe("POST /api/gym-requests — 미입점 체육관 입점 요청", () => {
  it.each([
    ["장소 ID 없음", { ...valid, placeId: "" }],
    ["장소 ID가 카카오 형식(숫자)이 아님", { ...valid, placeId: "<script>" }],
    ["이름 없음", { ...valid, name: "  " }],
    ["이름이 비정상적으로 김", { ...valid, name: "가".repeat(101) }],
    ["주소가 비정상적으로 김", { ...valid, address: "가".repeat(301) }],
  ])("%s → 400, 저장 안 함", async (_, body) => {
    const sb = fakeSupabase({});
    createClient.mockResolvedValue(sb.client);
    expect((await POST(jsonRequest(URL_, body))).status).toBe(400);
    expect(sb.calls).toHaveLength(0);
  });

  it("로그인 안 해도 요청 가능, 로그인했으면 회원 ID 기록, 공백 정리", async () => {
    const sb = fakeSupabase({ user: { id: "u1" } });
    createClient.mockResolvedValue(sb.client);
    const res = await POST(jsonRequest(URL_, valid));
    expect(await res.json()).toMatchObject({ ok: true, persisted: true });
    expect(sb.calls[0].args[0]).toEqual({
      kakao_place_id: "1234567890",
      name: "펀짐",
      address: "서울 강남구",
      phone: "02-000-0000",
      user_id: "u1",
    });
  });

  it("저장이 실패해도 손님 화면은 막지 않는다 (요청은 부가 기능)", async () => {
    createClient.mockResolvedValue(fakeSupabase({ responses: { "gym_requests.insert": { error: { message: "rls" } } } }).client);
    const res = await POST(jsonRequest(URL_, valid));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, persisted: false });
  });
});

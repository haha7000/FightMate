import { describe, expect, it, vi } from "vitest";
import { fakeSupabase, jsonRequest } from "@/test/fake-supabase";

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
const sendSms = vi.fn(async (_to: string, _text: string) => ({ ok: true as boolean, error: undefined as string | undefined }));
let configured = true;
vi.mock("@/lib/notify.server", () => ({
  sendSms: (to: string, text: string) => sendSms(to, text),
  get smsConfigured() {
    return configured;
  },
}));
const { POST } = await import("./route");

const URL_ = "http://localhost:3000/api/partner/notify-test";
const me = { user: { id: "owner1" } };

describe("POST /api/partner/notify-test — 관장 모드 테스트 문자", () => {
  it("로그인 필요", async () => {
    createClient.mockResolvedValue(fakeSupabase({ user: null }).client);
    expect((await POST(jsonRequest(URL_, { gymId: "g1" }))).status).toBe(401);
  });

  it("번호를 못 읽으면(미등록이거나 내 체육관이 아님) 404, 문자 안 보냄", async () => {
    createClient.mockResolvedValue(fakeSupabase({ ...me, responses: { "gym_notify.select": { data: null } } }).client);
    expect((await POST(jsonRequest(URL_, { gymId: "남의체육관" }))).status).toBe(404);
    expect(sendSms).not.toHaveBeenCalled();
  });

  it("발송 설정 전이면 503", async () => {
    configured = false;
    createClient.mockResolvedValue(fakeSupabase({ ...me, responses: { "gym_notify.select": { data: { phone: "01011112222" } } } }).client);
    expect((await POST(jsonRequest(URL_, { gymId: "g1" }))).status).toBe(503);
    configured = true;
  });

  it("등록된 번호로 테스트 문자", async () => {
    createClient.mockResolvedValue(fakeSupabase({ ...me, responses: { "gym_notify.select": { data: { phone: "01011112222" } } } }).client);
    expect((await POST(jsonRequest(URL_, { gymId: "g1" }))).status).toBe(200);
    expect(sendSms).toHaveBeenCalledWith("01011112222", expect.stringContaining("알림 테스트"));
  });

  it("발송 실패는 502로 이유 전달", async () => {
    sendSms.mockResolvedValueOnce({ ok: false, error: "잔액 부족" });
    createClient.mockResolvedValue(fakeSupabase({ ...me, responses: { "gym_notify.select": { data: { phone: "01011112222" } } } }).client);
    const res = await POST(jsonRequest(URL_, { gymId: "g1" }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("잔액 부족");
  });
});

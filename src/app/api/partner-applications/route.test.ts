import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, jsonRequest } from "@/test/fake-supabase";

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
const { POST } = await import("./route");

const URL_ = "http://localhost:3000/api/partner-applications";
const valid = { gymName: "그레이시 역삼", address: "", ownerName: "김관장", phone: "010-1234-5678", message: "저녁에 전화 주세요", agreed: true };
let ip = 0;
const post = (body: unknown, headers: Record<string, string> = { "x-forwarded-for": `10.0.0.${++ip}` }) =>
  POST(jsonRequest(URL_, body, { headers }));

beforeEach(() => createClient.mockReset());

describe("POST /api/partner-applications — 관장 입점 신청", () => {
  it("저장: 정리된 값 + 로그인했으면 회원 ID", async () => {
    const sb = fakeSupabase({ user: { id: "u1" } });
    createClient.mockResolvedValue(sb.client);
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(sb.calls[0]).toMatchObject({
      table: "partner_applications",
      op: "insert",
      args: [{ gym_name: "그레이시 역삼", address: "", owner_name: "김관장", phone: "01012345678", message: "저녁에 전화 주세요", user_id: "u1" }],
    });
  });

  it("로그인 없이도 신청 가능 (회원 ID 없음)", async () => {
    const sb = fakeSupabase({ user: null });
    createClient.mockResolvedValue(sb.client);
    expect((await post(valid)).status).toBe(200);
    expect((sb.calls[0].args[0] as { user_id: unknown }).user_id).toBeNull();
  });

  it("동의 안 하면 400, 저장 안 함", async () => {
    const sb = fakeSupabase({});
    createClient.mockResolvedValue(sb.client);
    const res = await post({ ...valid, agreed: false });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("동의");
    expect(sb.calls).toHaveLength(0);
  });

  it("입력이 이상하면 이유와 함께 400", async () => {
    createClient.mockResolvedValue(fakeSupabase({}).client);
    const res = await post({ ...valid, phone: "123" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("전화번호");
  });

  it("JSON이 아니면 400", async () => {
    const res = await POST(new Request(URL_, { method: "POST", body: "not json", headers: { "x-forwarded-for": "10.9.9.9" } }));
    expect(res.status).toBe(400);
  });

  it("DB 저장 실패는 500 (내부 오류는 숨김)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    createClient.mockResolvedValue(fakeSupabase({ responses: { "partner_applications.insert": { error: { message: "secret detail" } } } }).client);
    const res = await post(valid);
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });

  it("같은 IP는 시간당 5건까지 (스팸 방지)", async () => {
    createClient.mockResolvedValue(fakeSupabase({}).client);
    const h = { "x-forwarded-for": "7.7.7.7" };
    for (let i = 0; i < 5; i++) expect((await post(valid, h)).status).toBe(200);
    const blocked = await post(valid, h);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });
});

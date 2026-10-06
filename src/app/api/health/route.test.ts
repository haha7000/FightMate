import { describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "@/test/fake-supabase";

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
const { GET } = await import("./route");

describe("GET /api/health — 매일 핑", () => {
  it("DB를 실제로 한 번 조회하고 ok", async () => {
    const sb = fakeSupabase({ responses: { "gyms.select": { data: [{ id: "g1" }] } } });
    createClient.mockResolvedValue(sb.client);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, db: "ok" });
    expect(sb.calls[0].table).toBe("gyms");
  });

  it("DB가 죽었으면 503 (오류 내용은 숨김) → Actions가 실패 메일", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    createClient.mockResolvedValue(fakeSupabase({ responses: { "gyms.select": { error: { message: "project paused: secret" } } } }).client);
    const res = await GET();
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });

  it("데모 모드(키 없음)도 살아 있음", async () => {
    createClient.mockResolvedValue(null);
    expect(await (await GET()).json()).toEqual({ ok: true, db: "demo" });
  });
});

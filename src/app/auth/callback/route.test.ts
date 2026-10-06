import { describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "@/test/fake-supabase";

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
const { GET } = await import("./route");

const get = (path: string, headers: Record<string, string> = {}) =>
  GET(new Request(`http://localhost:3000${path}`, { headers }));

describe("GET /auth/callback — 로그인 코드 → 세션", () => {
  it("성공하면 next 경로로", async () => {
    createClient.mockResolvedValue(fakeSupabase({}).client);
    const res = await get("/auth/callback?code=abc&next=%2Fgym%2Fg1%2Fapply");
    expect(res.headers.get("location")).toBe("http://localhost:3000/gym/g1/apply");
  });

  it("next가 외부 주소면 홈으로 (오픈 리다이렉트 차단)", async () => {
    createClient.mockResolvedValue(fakeSupabase({}).client);
    const res = await get("/auth/callback?code=abc&next=%2F%2Fevil.com");
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("프록시 뒤에서는 실제 접속 주소로 돌려보낸다 (localhost로 튕기던 버그)", async () => {
    createClient.mockResolvedValue(fakeSupabase({}).client);
    const res = await get("/auth/callback?code=abc", { "x-forwarded-host": "fightmate-livid.vercel.app", "x-forwarded-proto": "https" });
    expect(res.headers.get("location")).toBe("https://fightmate-livid.vercel.app/");
  });

  it("코드가 없거나 교환 실패면 로그인 화면에 에러 표시", async () => {
    createClient.mockResolvedValue(fakeSupabase({ exchangeError: { message: "expired" } }).client);
    expect((await get("/auth/callback?code=old")).headers.get("location")).toBe("http://localhost:3000/login?error=auth");
    expect((await get("/auth/callback")).headers.get("location")).toBe("http://localhost:3000/login?error=auth");
  });
});

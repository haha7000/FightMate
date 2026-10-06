import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

// 세션 갱신(Supabase 호출)은 빼고 "코드 우회" 동작만 본다
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("proxy — 콜백이 아닌 곳에 떨어진 로그인 코드 구조", () => {
  it("첫 화면의 ?code= 를 콜백으로 넘기고 원래 경로를 next로", async () => {
    const res = await proxy(new NextRequest("http://localhost:3000/?code=abc"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/auth/callback?code=abc&next=%2F");
  });

  it("다른 페이지에 떨어져도 그 경로로 돌아오게", async () => {
    const res = await proxy(new NextRequest("http://localhost:3000/card?code=abc"));
    expect(res.headers.get("location")).toContain("next=%2Fcard");
  });

  it("Tailscale·Vercel 프록시 뒤에서도 실제 주소로", async () => {
    const req = new NextRequest("http://localhost:3000/?code=abc", {
      headers: { "x-forwarded-host": "npc.tail433877.ts.net", "x-forwarded-proto": "https" },
    });
    const res = await proxy(req);
    expect(res.headers.get("location")).toMatch(/^https:\/\/npc\.tail433877\.ts\.net\/auth\/callback\?/);
  });

  it("콜백 자체나 POST는 건드리지 않는다 (무한 반복 방지)", async () => {
    expect((await proxy(new NextRequest("http://localhost:3000/auth/callback?code=abc"))).headers.get("location")).toBeNull();
    expect((await proxy(new NextRequest("http://localhost:3000/?code=abc", { method: "POST" }))).headers.get("location")).toBeNull();
  });

  it("code가 없으면 통과", async () => {
    expect((await proxy(new NextRequest("http://localhost:3000/map"))).headers.get("location")).toBeNull();
  });
});

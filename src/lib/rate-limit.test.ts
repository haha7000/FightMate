import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./rate-limit";

describe("요청 횟수 제한", () => {
  it("창 안에서 한도까지 허용, 넘으면 남은 시간과 함께 거절", () => {
    const check = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect([0, 1, 2].map((t) => check("ip", t * 1000).ok)).toEqual([true, true, true]);
    expect(check("ip", 10_000)).toEqual({ ok: false, retryAfterSec: 50 });
  });

  it("창이 지나면 다시 허용, 사람마다 따로 센다", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(check("a", 0).ok).toBe(true);
    expect(check("a", 500).ok).toBe(false);
    expect(check("b", 500).ok).toBe(true);
    expect(check("a", 1000).ok).toBe(true);
  });

  it("기록이 상한을 넘으면 오래된 것부터 지운다 (메모리 보호)", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 2 });
    check("a", 0);
    check("b", 0);
    check("c", 0); // a가 밀려남
    expect(check("a", 1).ok).toBe(true);
  });

  it("IP는 프록시 헤더의 첫 값", () => {
    const req = (h: Record<string, string>) => new Request("http://x", { headers: h });
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(req({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(req({}))).toBe("unknown");
  });
});

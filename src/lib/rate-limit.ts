// 간단한 요청 횟수 제한 (IP별 고정 창). 서버 인스턴스 메모리에만 있어 인스턴스마다 따로 센다 —
// 완벽한 차단이 아니라 한 사람이 스크립트로 카카오 쿼터를 다 써버리는 걸 막는 1차 방어선.
export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }: { limit: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, { start: number; count: number }>();

  return function check(key: string, now = Date.now()): { ok: boolean; retryAfterSec: number } {
    const cur = hits.get(key);
    if (!cur || now - cur.start >= windowMs) {
      if (!cur && hits.size >= maxKeys) hits.delete(hits.keys().next().value!); // 메모리 상한
      hits.set(key, { start: now, count: 1 });
      return { ok: true, retryAfterSec: 0 };
    }
    cur.count += 1;
    if (cur.count > limit) return { ok: false, retryAfterSec: Math.ceil((cur.start + windowMs - now) / 1000) };
    return { ok: true, retryAfterSec: 0 };
  };
}

// 요청한 사람의 IP (프록시 뒤라 x-forwarded-for의 첫 값)
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

// 프록시(Tailscale serve·Vercel) 뒤에서는 request.url이 내부 주소(localhost)로 보인다.
// 브라우저가 실제로 접속한 주소를 x-forwarded-* 헤더로 복원한다.
export function publicOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || url.host;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

// 사이트 대표 주소 (사이트맵·robots·공유 링크). 요청이 없는 곳에서 쓴다.
// 순서: 직접 지정(NEXT_PUBLIC_SITE_URL) → Vercel 운영 도메인 → 로컬
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

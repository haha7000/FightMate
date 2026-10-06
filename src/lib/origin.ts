// 프록시(Tailscale serve·Vercel) 뒤에서는 request.url이 내부 주소(localhost)로 보인다.
// 브라우저가 실제로 접속한 주소를 x-forwarded-* 헤더로 복원한다.
export function publicOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || url.host;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

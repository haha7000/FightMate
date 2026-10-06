// 방문 통계로 보내기 전에 주소를 다듬는다.
// - 초대 링크 토큰·로그인 코드처럼 비밀스러운 값은 지운다
// - 관장·운영자 화면은 손님 지표가 아니니 세지 않는다 (null = 안 보냄)
const STAFF_PATHS = ["/ops", "/partner", "/admin"];

export function scrubAnalyticsUrl(raw: string): string | null {
  const url = new URL(raw);
  if (STAFF_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return null;
  url.pathname = url.pathname
    .replace(/^\/invite\/[^/]+/, "/invite/[token]")
    .replace(/^\/fighter\/[^/]+/, "/fighter/[id]");
  url.search = ""; // ?code=…(로그인), ?next=… 등
  url.hash = "";
  return url.toString();
}

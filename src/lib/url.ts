// 로그인 후 이동할 경로는 우리 사이트 내부 경로만 허용한다.
// "//evil.com"(프로토콜 상대 URL)이나 "@evil.com" 같은 값으로 외부 사이트로 보내는 것(오픈 리다이렉트) 차단.
export function safeNextPath(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

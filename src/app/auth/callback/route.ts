import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 프록시(Tailscale serve·Vercel) 뒤에서는 request.url이 내부 주소(localhost)로 보인다.
// 브라우저가 실제로 접속한 주소로 돌려보내야 로그인 쿠키가 같은 사이트에 남는다.
function publicOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || url.host;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

// 로그인 후 이동할 경로는 우리 사이트 내부 경로만 허용 ("//evil.com", "@evil.com" 차단)
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// OAuth 로그인 후 Supabase가 ?code=... 를 달고 이리로 리다이렉트한다.
// code를 세션으로 교환하고 홈으로 보낸다.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = publicOrigin(request);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // 실패 시 로그인 화면으로
  return NextResponse.redirect(`${origin}/login?error=auth`);
}

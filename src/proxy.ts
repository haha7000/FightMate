import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16: 구 middleware.ts → proxy.ts. 매 요청마다 Supabase 세션 쿠키를 갱신한다.
// 환경변수가 없으면(키 미설정 단계) 아무것도 하지 않고 통과시킨다.
export async function proxy(request: NextRequest) {
  // OAuth 코드가 콜백이 아닌 곳(예: 첫 화면)에 도착하면 콜백으로 넘긴다.
  // Supabase는 redirect_to가 허용 목록(Redirect URLs)에 없으면 Site URL로 코드를 보내버리는데,
  // 그러면 아무도 코드를 세션으로 바꾸지 않아 "로그인했는데 안 된" 상태가 된다.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.method === "GET" && request.nextUrl.pathname !== "/auth/callback") {
    // 프록시(Tailscale serve·Vercel) 뒤에서도 브라우저가 접속한 실제 주소로 보낸다
    const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.nextUrl.host;
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
      request.nextUrl.protocol.replace(":", "");
    const target = new URL(`${proto}://${host}/auth/callback`);
    target.searchParams.set("code", code);
    target.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(target);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });

  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getClaims/getUser 호출이 만료된 토큰을 갱신한다.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // 정적 자산·이미지 제외 (auth 로직이 CSS/JS/이미지 로딩을 막지 않도록)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|gyms/|.*\\.svg$).*)"],
};

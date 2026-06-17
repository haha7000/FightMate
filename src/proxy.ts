import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16: 구 middleware.ts → proxy.ts. 매 요청마다 Supabase 세션 쿠키를 갱신한다.
// 환경변수가 없으면(키 미설정 단계) 아무것도 하지 않고 통과시킨다.
export async function proxy(request: NextRequest) {
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

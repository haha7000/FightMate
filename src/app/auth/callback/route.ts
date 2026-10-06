import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicOrigin } from "@/lib/origin";
import { safeNextPath } from "@/lib/url";

// OAuth 로그인 후 Supabase가 ?code=... 를 달고 이리로 리다이렉트한다.
// code를 세션으로 교환하고 홈으로 보낸다.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = publicOrigin(request);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

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

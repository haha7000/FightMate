import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

// 서버 컴포넌트 / 라우트 핸들러용 Supabase 클라이언트.
// Next.js 16: cookies()는 async.
// 키가 없으면 null → 호출부에서 목데이터 폴백.
export async function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // 서버 컴포넌트에서 호출되면 set이 막힘 — proxy가 세션을 갱신하므로 무시 가능.
        }
      },
    },
  });
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  clearSession,
  getSession,
  setSession,
  type Session,
} from "@/lib/store";

export interface AuthUser {
  name: string;
  provider: "kakao" | "google";
}

// Supabase가 설정돼 있으면 실제 OAuth, 아니면 localStorage 데모 세션.
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // 데모 모드
      const s = getSession();
      setUser(s ? { name: s.name, provider: s.provider } : null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(toAuthUser(data.user));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(toAuthUser(session?.user ?? null));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async (provider: "kakao" | "google"): Promise<{ error?: string }> => {
      if (!isSupabaseConfigured) {
        const s: Session = { name: "데모 유저", provider };
        setSession(s);
        setUser({ name: s.name, provider });
        window.location.href = "/";
        return {};
      }
      const supabase = createClient();
      if (!supabase) return { error: "Supabase 클라이언트를 만들 수 없어요." };

      // 리다이렉트를 직접 수행한다 (SDK 자동 이동이 안 되는 환경 대비 + 에러 노출).
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
          // 카카오는 비즈앱이 아니면 이메일 동의 불가 → 닉네임만 요청 (KOE006 방지)
          ...(provider === "kakao" ? { scopes: "profile_nickname" } : {}),
        },
      });

      if (error) {
        console.error("[signIn]", error);
        return { error: error.message };
      }
      if (data?.url) {
        window.location.href = data.url;
        return {};
      }
      return { error: "로그인 URL을 받지 못했어요." };
    },
    []
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      const supabase = createClient();
      await supabase?.auth.signOut();
    } else {
      clearSession();
    }
    setUser(null);
    window.location.href = "/";
  }, []);

  return { user, loading, signIn, signOut };
}

// Supabase user 객체 → 앱 유저 형태로 변환
function toAuthUser(
  user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null
): AuthUser | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const name =
    (meta.name as string) ||
    (meta.full_name as string) ||
    (meta.nickname as string) ||
    "파이터";
  const provider =
    ((user.app_metadata?.provider as string) === "google" ? "google" : "kakao") as
      | "kakao"
      | "google";
  return { name, provider };
}

"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SESSION_STORAGE_KEY, clearSession, setSession, type Session } from "@/lib/store";
import { safeNextPath } from "@/lib/url";
import { displayName } from "@/lib/user";

export type Provider = "kakao" | "google";

export interface AuthUser {
  name: string;
  provider: Provider;
}

// ── 데모 모드(Supabase 키 없음): localStorage 세션을 외부 저장소로 구독 ──
// useSyncExternalStore를 쓰면 서버 렌더(세션 없음)와 브라우저 값이 어긋나도 React가 안전하게 맞춘다.
function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readDemoSession(): string | null {
  if (isSupabaseConfigured) return null;
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseDemoSession(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Session;
    return { name: s.name, provider: s.provider };
  } catch {
    return null;
  }
}

// Supabase가 설정돼 있으면 실제 OAuth, 아니면 localStorage 데모 세션.
export function useAuth() {
  const demoRaw = useSyncExternalStore(subscribeStorage, readDemoSession, () => null);
  const demoUser = useMemo(() => parseDemoSession(demoRaw), [demoRaw]);

  const [sbUser, setSbUser] = useState<AuthUser | null>(null);
  const [sbLoading, setSbLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    if (!supabase) return;

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setSbUser(toAuthUser(data.user));
      setSbLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSbUser(toAuthUser(session?.user ?? null));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (provider: Provider, next?: string): Promise<{ error?: string }> => {
    const target = safeNextPath(next);
    if (!isSupabaseConfigured) {
      setSession({ name: "데모 유저", provider });
      window.location.href = target;
      return {};
    }
    const supabase = createClient();
    if (!supabase) return { error: "Supabase 클라이언트를 만들 수 없어요." };

    // 리다이렉트를 직접 수행한다 (SDK 자동 이동이 안 되는 환경 대비 + 에러 노출).
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`,
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
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await createClient()?.auth.signOut();
    } else {
      clearSession();
    }
    window.location.href = "/";
  }, []);

  return {
    user: isSupabaseConfigured ? sbUser : demoUser,
    loading: isSupabaseConfigured ? sbLoading : false,
    signIn,
    signOut,
  };
}

// Supabase user 객체 → 앱 유저 형태로 변환
function toAuthUser(
  user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null
): AuthUser | null {
  if (!user) return null;
  return {
    name: displayName(user.user_metadata, "파이터"),
    provider: user.app_metadata?.provider === "google" ? "google" : "kakao",
  };
}

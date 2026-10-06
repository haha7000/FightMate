"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"kakao" | "google" | null>(null);

  async function handleSignIn(provider: "kakao" | "google") {
    setError(null);
    setBusy(provider);
    // ?next=/gym/xxx/apply 처럼 로그인 전에 하던 화면으로 돌아가기
    const next = new URLSearchParams(window.location.search).get("next") ?? undefined;
    const { error } = await signIn(provider, next);
    if (error) {
      setError(error);
      setBusy(null);
    }
    // 성공 시 브라우저가 OAuth 페이지로 이동하므로 busy 유지
  }

  return (
    <main className="grain flex min-h-dvh flex-col bg-night px-6 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-white">
      <div className="flex justify-end">
        <Link href="/" aria-label="닫기" className="-mr-2 flex h-10 w-10 items-center justify-center text-white/70">
          <X size={24} />
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <p className="font-num text-[15px] tracking-[0.18em]">
          FIGHT<span className="text-brand-bright">MATE</span>
        </p>
        <h1 className="mt-6 font-display text-[42px] leading-[1.06]">
          남의 매트도
          <br />
          밟아봐야
          <br />
          <span className="text-brand-bright">강해진다.</span>
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-white/60">
          3초 만에 시작하고, 전화 없이 체험·1일권을 예약하세요.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => handleSignIn("kakao")}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3.5 text-[15px] font-semibold text-black/85 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M12 3C6.48 3 2 6.5 2 10.82c0 2.78 1.86 5.22 4.66 6.6l-.95 3.48c-.08.3.26.54.52.37l4.13-2.74c.53.06 1.08.1 1.64.1 5.52 0 10-3.5 10-7.81S17.52 3 12 3z"
            />
          </svg>
          {busy === "kakao" ? "이동 중…" : "카카오로 시작하기"}
        </button>
        <button
          onClick={() => handleSignIn("google")}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-[15px] font-semibold text-black/85 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
          </svg>
          {busy === "google" ? "이동 중…" : "Google로 계속하기"}
        </button>
        {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-center text-[13px] text-red-300">로그인 실패: {error}</p>}
        <p className="mt-2 text-center text-[12px] text-white/40">
          {isSupabaseConfigured ? (
            <>
              로그인하면{" "}
              <Link href="/terms" className="underline underline-offset-2">
                이용약관
              </Link>{" "}
              및{" "}
              <Link href="/privacy" className="underline underline-offset-2">
                개인정보처리방침
              </Link>
              에 동의하게 됩니다.
            </>
          ) : (
            "데모 모드입니다. 키 연결 전까지 가짜 로그인으로 동작합니다."
          )}
        </p>
        <Link href="/for-gyms" className="mt-1 text-center text-[13px] font-semibold text-white/70 underline underline-offset-2">
          체육관 관장님이신가요? 입점 신청
        </Link>
      </div>
    </main>
  );
}

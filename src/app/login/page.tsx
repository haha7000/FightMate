"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"kakao" | "google" | null>(null);

  async function handleSignIn(provider: "kakao" | "google") {
    setError(null);
    setBusy(provider);
    const { error } = await signIn(provider);
    if (error) {
      setError(error);
      setBusy(null);
    }
    // 성공 시 브라우저가 OAuth 페이지로 이동하므로 busy 유지
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <Link href="/" className="absolute top-6 text-sm text-neutral-500">
        ← 둘러보기
      </Link>

      <p className="text-xs font-semibold tracking-widest text-orange-600">
        FIGHTMATE
      </p>
      <h1 className="mt-3 text-2xl font-bold leading-snug">
        3초 만에 시작하고
        <br />
        체험을 예약하세요
      </h1>

      <div className="mt-10 flex flex-col gap-3">
        <button
          onClick={() => handleSignIn("kakao")}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3.5 font-bold text-[#191919] active:brightness-95 disabled:opacity-60"
        >
          {busy === "kakao" ? "이동 중…" : "💬 카카오로 3초 만에 시작하기"}
        </button>
        <button
          onClick={() => handleSignIn("google")}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white py-3.5 font-bold text-neutral-900 active:bg-neutral-100 disabled:opacity-60"
        >
          {busy === "google" ? "이동 중…" : "G  Google로 계속하기"}
        </button>
        {error && (
          <p className="rounded-lg bg-orange-50 px-3 py-2 text-center text-sm text-orange-700">
            로그인 실패: {error}
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-neutral-400">
        {isSupabaseConfigured
          ? "로그인하면 이용약관 및 개인정보처리방침에 동의하게 됩니다."
          : "데모 모드입니다 — 키 연결 전까지 가짜 로그인으로 동작합니다."}
      </p>
    </main>
  );
}

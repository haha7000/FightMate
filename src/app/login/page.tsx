"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const { signIn } = useAuth();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <Link href="/" className="absolute top-6 text-sm text-neutral-400">
        ← 둘러보기
      </Link>

      <p className="text-xs font-semibold tracking-widest text-red-500">
        FIGHTMATE
      </p>
      <h1 className="mt-3 text-2xl font-bold leading-snug">
        3초 만에 시작하고
        <br />
        체험을 예약하세요
      </h1>

      <div className="mt-10 flex flex-col gap-3">
        <button
          onClick={() => signIn("kakao")}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3.5 font-bold text-[#191919] active:brightness-95"
        >
          💬 카카오로 3초 만에 시작하기
        </button>
        <button
          onClick={() => signIn("google")}
          className="flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-bold text-neutral-900 active:brightness-95"
        >
          G  Google로 계속하기
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-neutral-600">
        {isSupabaseConfigured
          ? "로그인하면 이용약관 및 개인정보처리방침에 동의하게 됩니다."
          : "데모 모드입니다 — 키 연결 전까지 가짜 로그인으로 동작합니다."}
      </p>
    </main>
  );
}

"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { getGym, formatPrice } from "@/lib/gyms";
import { addBooking } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const gym = getGym(id);
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!gym) notFound();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId: id, name, phone, date }),
      });
      if (!res.ok) throw new Error();
      // Supabase 미설정(데모) 시에만 로컬에 저장. 설정 시엔 API가 DB에 저장함.
      if (!isSupabaseConfigured) {
        addBooking({ gymId: id, gymName: gym!.name, name, phone, date, type: "체험" });
      }
      setDone(true);
    } catch {
      setError("신청에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
        <div className="text-5xl">🥊</div>
        <h1 className="mt-5 text-xl font-bold">체험 신청 완료!</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          {gym.name}에 신청이 전달됐어요.
          <br />
          체육관에서 확인 후 연락드릴 거예요.
        </p>
        <button
          onClick={() => router.push("/bookings")}
          className="mt-8 w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white"
        >
          내 예약에서 확인하기
        </button>
        <button
          onClick={() => router.push("/")}
          className="mt-3 w-full rounded-xl bg-neutral-100 py-3.5 font-bold"
        >
          다른 체육관 둘러보기
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-6 md:pt-10">
      <Link href={`/gym/${id}`} className="text-sm text-neutral-500">
        ← {gym.name}
      </Link>
      <h1 className="mt-5 text-xl font-bold">체험 신청</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {gym.name} · 체험 {formatPrice(gym.trialPrice)}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <Field label="이름">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="input"
          />
        </Field>
        <Field label="연락처">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            className="input"
          />
        </Field>
        <Field label="희망 날짜">
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </Field>

        {error && <p className="text-sm text-orange-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-xl bg-orange-500 py-3.5 font-bold text-white active:bg-orange-600 disabled:opacity-50"
        >
          {submitting ? "신청 중..." : "신청하기"}
        </button>
        <p className="text-center text-xs text-neutral-400">
          결제는 체험 당일 체육관에서 진행돼요. (온라인 결제 준비 중)
        </p>
      </form>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

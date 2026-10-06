"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import { type Gym } from "@/lib/gyms";
import { addBooking } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatWon } from "@/lib/format";
import { Field } from "@/components/ui/Field";

export default function ApplyForm({ gym, kind }: { gym: Gym; kind: "체험" | "1일권" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = kind === "1일권" ? gym.dayPassPrice ?? 0 : gym.trialPrice;
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, 지난 날짜 선택 방지

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId: gym.id, name, phone, date, type: kind }),
      });
      if (!res.ok) throw new Error();
      // Supabase 미설정(데모) 시에만 로컬에 저장. 설정 시엔 API가 DB에 저장함.
      if (!isSupabaseConfigured) {
        addBooking({ gymId: gym.id, gymName: gym.name, name, phone, date, type: kind });
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
      <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint">
          <Check size={32} strokeWidth={2.75} className="text-brand" />
        </span>
        <h1 className="mt-5 text-[22px] font-bold">{kind} 신청 완료</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {gym.name}에 신청이 전달됐어요.
          <br />
          체육관에서 확인 후 연락드릴 거예요.
        </p>
        <div className="mt-8 w-full space-y-2">
          <button
            onClick={() => router.push("/bookings")}
            className="w-full rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white"
          >
            내 예약에서 확인하기
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-xl bg-field py-3.5 text-[15px] font-bold"
          >
            다른 체육관 둘러보기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-white pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <header className="flex items-center gap-1 px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2">
        <Link href={`/gym/${gym.id}`} aria-label="뒤로" className="flex h-10 w-10 items-center justify-center">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-[17px] font-bold">{kind} 신청</h1>
      </header>

      <div className="mx-4 flex items-center gap-3 rounded-xl border border-line p-3">
        {gym.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gym.photos[0].src} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
        )}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{gym.name}</p>
          <p className="mt-0.5 text-[13px] text-muted">
            {kind} · <b className="text-brand">{formatWon(price)}</b>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5 px-4">
        <Field label="이름">
          <input
            type="text"
            required
            autoComplete="name"
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
            inputMode="tel"
            autoComplete="tel"
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
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </Field>

        {error && <p className="text-[14px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white disabled:opacity-50"
        >
          {submitting ? "신청 중…" : `${kind} 신청하기`}
        </button>
        <p className="text-center text-[12px] text-muted">
          결제는 당일 체육관에서 진행돼요. (온라인 결제 준비 중)
        </p>
      </form>
    </main>
  );
}


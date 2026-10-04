"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type GymEvent } from "@/lib/events";
import { fetchRsvped, setRsvp } from "@/lib/data.client";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// 이벤트 참가 신청/취소. 신청 시 이름·연락처를 받아 관장 명단에 남기고,
// 표시 인원을 낙관적으로 갱신한다.
export default function RsvpButton({ event }: { event: GymEvent }) {
  const { user } = useAuth();
  const router = useRouter();
  const [rsvped, setRsvped] = useState(false);
  const [count, setCount] = useState(event.attendees); // 표시용 총 인원
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetchRsvped(event.id).then((on) => {
      setRsvped(on);
      // 데모 모드: 서버가 localStorage를 못 읽으므로 본인 신청분을 더해 표시
      if (on && !isSupabaseConfigured) setCount((c) => c + 1);
    });
  }, [event.id]);

  const cap = event.capacity;
  const full = cap != null && count >= cap && !rsvped;
  const left = cap != null ? Math.max(0, cap - count) : null;

  function openForm() {
    setError(null);
    // 실제 모드에서 비로그인 → 로그인 화면으로
    if (isSupabaseConfigured && !user) {
      router.push("/login");
      return;
    }
    // 로그인 이름 자동 채움
    if (!name && user?.name) setName(user.name);
    setFormOpen(true);
  }

  async function confirmRsvp(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    // 낙관적 업데이트
    setRsvped(true);
    setCount((c) => c + 1);
    setFormOpen(false);

    const res = await setRsvp(event.id, true, {
      name: name.trim(),
      phone: phone.trim(),
    });
    setBusy(false);
    if (!res.ok) {
      setRsvped(false);
      setCount((c) => c - 1);
      setError(res.error ?? "잠시 후 다시 시도해주세요");
    }
  }

  async function cancelRsvp() {
    setBusy(true);
    setError(null);
    setRsvped(false);
    setCount((c) => c - 1);

    const res = await setRsvp(event.id, false);
    setBusy(false);
    if (!res.ok) {
      setRsvped(true);
      setCount((c) => c + 1);
      setError(res.error ?? "잠시 후 다시 시도해주세요");
    }
  }

  return (
    <div>
      {formOpen ? (
        <form
          onSubmit={confirmRsvp}
          className="flex flex-col gap-2"
        >
          <input
            className="w-full border border-white/20 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-brand-bright focus:outline-none"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
          />
          <input
            className="w-full border border-white/20 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-brand-bright focus:outline-none"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="연락처 (선택)"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="flex-1 border border-white/25 py-3 text-[14px] font-semibold text-white/80"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-[1.4] bg-brand-bright py-3 text-[15px] font-bold text-night disabled:opacity-50"
            >
              신청 확정
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={rsvped ? cancelRsvp : openForm}
          disabled={busy || full}
          className={`w-full py-3.5 text-center text-[16px] font-bold transition-colors disabled:opacity-40 ${
            rsvped ? "border border-brand-bright text-brand-bright" : "bg-brand-bright text-night"
          }`}
        >
          {full
            ? "정원 마감"
            : rsvped
              ? "참가 신청됨 · 취소하기"
              : "참가 신청하기"}
        </button>
      )}

      <p className="mt-2 text-center text-[12px] text-white/50">
        {cap != null
          ? `${count}/${cap}명 신청${left && left > 0 ? ` · ${left}자리 남음` : ""}`
          : `${count}명 신청`}
      </p>
      {error && (
        <p className="mt-1 text-center text-[12px] text-red-400">{error}</p>
      )}
    </div>
  );
}

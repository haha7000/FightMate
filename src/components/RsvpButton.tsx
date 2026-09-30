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
          className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3"
        >
          <input
            className="input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
          />
          <input
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="연락처 (선택)"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-medium text-neutral-600"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white active:bg-orange-600 disabled:opacity-50"
            >
              신청 확정
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={rsvped ? cancelRsvp : openForm}
          disabled={busy || full}
          className={`w-full rounded-xl py-3.5 text-center font-bold transition-colors disabled:opacity-50 ${
            rsvped
              ? "bg-neutral-100 text-orange-600"
              : "bg-orange-500 text-white active:bg-orange-600"
          }`}
        >
          {full
            ? "정원 마감"
            : rsvped
              ? "✅ 참가 신청됨 · 취소하기"
              : "🙌 참가 신청하기"}
        </button>
      )}

      <p className="mt-2 text-center text-xs text-neutral-400">
        {cap != null
          ? `${count}/${cap}명 신청${left && left > 0 ? ` · ${left}자리 남음` : ""}`
          : `${count}명 신청`}
      </p>
      {error && (
        <p className="mt-1 text-center text-xs text-orange-600">{error}</p>
      )}
    </div>
  );
}

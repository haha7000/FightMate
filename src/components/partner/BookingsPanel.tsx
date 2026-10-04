"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Phone } from "lucide-react";
import { fetchGymBookings, setBookingStatus, type BookingStatus, type GymBooking } from "@/lib/partner.client";

const FILTERS: { key: "pending" | "confirmed" | "all"; label: string }[] = [
  { key: "pending", label: "새 신청" },
  { key: "confirmed", label: "확정" },
  { key: "all", label: "전체" },
];

const STATUS_STYLE: Record<BookingStatus, string> = {
  신청됨: "bg-brand-tint text-brand",
  확정: "bg-ink text-white",
  거절: "bg-field text-muted",
  "사용 완료": "bg-field text-muted",
};

// 신청 관리: 새 신청 → 확정/거절, 전화·문자 바로 걸기
export default function BookingsPanel({ gymId }: { gymId: string }) {
  const [bookings, setBookings] = useState<GymBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchGymBookings(gymId)
      .then(setBookings)
      .catch((e: Error) => setError(e.message));
  }, [gymId]);

  async function change(id: string, status: BookingStatus) {
    setBusyId(id);
    setError(null);
    const prev = bookings;
    setBookings((list) => list?.map((b) => (b.id === id ? { ...b, status } : b)) ?? null);
    try {
      await setBookingStatus(id, status);
    } catch (e) {
      setBookings(prev);
      setError(e instanceof Error ? e.message : "변경하지 못했어요");
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = bookings?.filter((b) => b.status === "신청됨").length ?? 0;
  const visible =
    bookings?.filter((b) =>
      filter === "pending" ? b.status === "신청됨" : filter === "confirmed" ? b.status === "확정" : true
    ) ?? [];

  return (
    <section className="px-4 pt-4">
      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${
              filter === f.key ? "border-transparent bg-ink text-white" : "border-line bg-white"
            }`}
          >
            {f.label}
            {f.key === "pending" && pendingCount > 0 && <span className="ml-1 text-brand-bright">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}

      {bookings === null && !error && <p className="py-16 text-center text-[14px] text-muted">불러오는 중…</p>}

      {bookings !== null && visible.length === 0 && (
        <p className="py-16 text-center text-[14px] text-muted">
          {filter === "pending" ? "새로 들어온 신청이 없어요" : "해당하는 신청이 없어요"}
        </p>
      )}

      <ul className="mt-3 flex flex-col gap-2">
        {visible.map((b) => (
          <li key={b.id} className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[16px] font-semibold">
                  {b.name} <span className="text-[13px] font-medium text-muted">· {b.type}</span>
                </p>
                <p className="mt-0.5 text-[13px] text-muted tabular-nums">
                  희망일 <b className="text-ink">{b.date}</b> · 신청 {b.createdAt.slice(5, 10).replace("-", "/")}
                </p>
              </div>
              <span className={`shrink-0 rounded-md px-2 py-1 text-[12px] font-semibold ${STATUS_STYLE[b.status]}`}>
                {b.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[14px] font-semibold">
              <a href={`tel:${b.phone}`} className="flex items-center justify-center gap-1.5 rounded-lg bg-field py-2.5">
                <Phone size={16} /> 전화
              </a>
              <a href={`sms:${b.phone}`} className="flex items-center justify-center gap-1.5 rounded-lg bg-field py-2.5">
                <MessageSquare size={16} /> 문자
              </a>
            </div>

            {b.status === "신청됨" && (
              <div className="mt-2 grid grid-cols-[1fr_1.6fr] gap-2 text-[14px] font-bold">
                <button
                  disabled={busyId === b.id}
                  onClick={() => change(b.id, "거절")}
                  className="rounded-lg border border-line py-2.5 text-muted disabled:opacity-50"
                >
                  거절
                </button>
                <button
                  disabled={busyId === b.id}
                  onClick={() => change(b.id, "확정")}
                  className="rounded-lg bg-brand py-2.5 text-white disabled:opacity-50"
                >
                  확정하기
                </button>
              </div>
            )}
            {b.status === "확정" && (
              <button
                disabled={busyId === b.id}
                onClick={() => change(b.id, "사용 완료")}
                className="mt-2 w-full rounded-lg border border-line py-2.5 text-[14px] font-semibold disabled:opacity-50"
              >
                방문 완료 처리
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

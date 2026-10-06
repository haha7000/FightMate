"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Phone, RotateCcw } from "lucide-react";
import NotifyCard from "./NotifyCard";
import { fetchGymBookings, setBookingStatus, type BookingStatus, type GymBooking } from "@/lib/partner.client";
import { Chip } from "@/components/ui/Chip";
import { monthDay } from "@/lib/format";

type Filter = "pending" | "confirmed" | "history";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "새 신청" },
  { key: "confirmed", label: "확정" },
  { key: "history", label: "지난 내역" },
];

const STATUS_STYLE: Record<BookingStatus, string> = {
  신청됨: "bg-brand-tint text-brand",
  확정: "bg-ink text-white",
  거절: "bg-red-50 text-red-700",
  "사용 완료": "bg-field text-muted",
};

// 확인이 필요한 상태 변경 (실수로 누르면 손님에게 바로 영향이 가는 것)
type Pending = { booking: GymBooking; to: BookingStatus };

// 문자 앱을 본문이 채워진 상태로 열기 (iOS는 &body=, 그 외는 ?body=)
function smsHref(phone: string, body: string) {
  const ios = typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
  return `sms:${phone}${ios ? "&" : "?"}body=${encodeURIComponent(body)}`;
}

// 신청 관리: 새 신청 → 확정/거절, 지난 내역에서 다시 연락·다시 확정
export default function BookingsPanel({ gymId, gymName }: { gymId: string; gymName: string }) {
  const [bookings, setBookings] = useState<GymBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Pending | null>(null);

  useEffect(() => {
    fetchGymBookings(gymId)
      .then(setBookings)
      .catch((e: Error) => setError(e.message));
  }, [gymId]);

  async function change(id: string, status: BookingStatus) {
    setBusyId(id);
    setError(null);
    const prev = bookings;
    const now = new Date().toISOString();
    setBookings((list) => list?.map((b) => (b.id === id ? { ...b, status, statusChangedAt: now } : b)) ?? null);
    try {
      await setBookingStatus(id, status);
    } catch (e) {
      setBookings(prev);
      setError(e instanceof Error ? e.message : "변경하지 못했어요");
    } finally {
      setBusyId(null);
    }
  }

  const count = (f: Filter) => bookings?.filter((b) => inFilter(b, f)).length ?? 0;
  const visible = (bookings?.filter((b) => inFilter(b, filter)) ?? []).sort((a, b) =>
    filter === "history"
      ? (b.statusChangedAt ?? b.createdAt).localeCompare(a.statusChangedAt ?? a.createdAt)
      : 0
  );

  return (
    <section className="px-4 pt-4">
      <NotifyCard gymId={gymId} />

      <div className="mt-4 flex gap-1.5">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
            {bookings && count(f.key) > 0 && (
              <span
                className={
                  f.key === "pending"
                    ? filter === f.key
                      ? "text-brand-bright"
                      : "text-brand"
                    : filter === f.key
                      ? "text-white/60"
                      : "text-muted"
                }
              >
                {count(f.key)}
              </span>
            )}
          </Chip>
        ))}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
      {bookings === null && !error && <p className="py-16 text-center text-[14px] text-muted">불러오는 중…</p>}
      {bookings !== null && visible.length === 0 && (
        <p className="py-16 text-center text-[14px] text-muted">
          {filter === "pending" ? "새로 들어온 신청이 없어요" : filter === "confirmed" ? "확정한 신청이 없어요" : "지난 내역이 없어요"}
        </p>
      )}

      <ul className="mt-3 flex flex-col gap-2">
        {visible.map((b) => {
          const busy = busyId === b.id;
          const reofferText = `[FightMate] ${gymName}입니다. ${monthDay(b.date)} ${b.type} 신청 주셨는데 자리가 생겨 연락드려요. 그 날 오실 수 있으면 답장 주세요!`;
          return (
            <li key={b.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold">
                    {b.name} <span className="text-[13px] font-medium text-muted">· {b.type}</span>
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted tabular-nums">
                    희망일 <b className="text-ink">{b.date}</b> · 신청 {monthDay(b.createdAt)}
                    {b.statusChangedAt && b.status !== "신청됨" && ` · ${monthDay(b.statusChangedAt)} ${b.status}`}
                  </p>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-1 text-[12px] font-semibold ${STATUS_STYLE[b.status]}`}>
                  {b.status}
                </span>
              </div>

              {b.status === "거절" ? (
                // 거절했던 신청: 자리가 나면 먼저 연락하고, 손님이 오겠다면 다시 확정
                <div className="mt-3 flex flex-col gap-2 text-[14px] font-semibold">
                  <a
                    href={smsHref(b.phone, reofferText)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-tint py-2.5 text-brand"
                  >
                    <MessageSquare size={16} /> 자리 났어요 문자 보내기
                  </a>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={`tel:${b.phone}`} className="flex items-center justify-center gap-1.5 rounded-lg bg-field py-2.5">
                      <Phone size={16} /> 전화
                    </a>
                    <button
                      disabled={busy}
                      onClick={() => setConfirming({ booking: b, to: "확정" })}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-line py-2.5 disabled:opacity-50"
                    >
                      <RotateCcw size={15} /> 확정으로 바꾸기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[14px] font-semibold">
                  <a href={`tel:${b.phone}`} className="flex items-center justify-center gap-1.5 rounded-lg bg-field py-2.5">
                    <Phone size={16} /> 전화
                  </a>
                  <a href={`sms:${b.phone}`} className="flex items-center justify-center gap-1.5 rounded-lg bg-field py-2.5">
                    <MessageSquare size={16} /> 문자
                  </a>
                </div>
              )}

              {b.status === "신청됨" && (
                <div className="mt-2 grid grid-cols-[1fr_1.6fr] gap-2 text-[14px] font-bold">
                  <button
                    disabled={busy}
                    onClick={() => setConfirming({ booking: b, to: "거절" })}
                    className="rounded-lg border border-line py-2.5 text-muted disabled:opacity-50"
                  >
                    거절
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => change(b.id, "확정")}
                    className="rounded-lg bg-brand py-2.5 text-white disabled:opacity-50"
                  >
                    확정하기
                  </button>
                </div>
              )}
              {b.status === "확정" && (
                <button
                  disabled={busy}
                  onClick={() => change(b.id, "사용 완료")}
                  className="mt-2 w-full rounded-lg border border-line py-2.5 text-[14px] font-semibold disabled:opacity-50"
                >
                  방문 완료 처리
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {confirming && (
        <ConfirmSheet
          pending={confirming}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            change(confirming.booking.id, confirming.to);
            setConfirming(null);
          }}
        />
      )}
    </section>
  );
}

function inFilter(b: GymBooking, f: Filter) {
  if (f === "pending") return b.status === "신청됨";
  if (f === "confirmed") return b.status === "확정";
  return b.status === "거절" || b.status === "사용 완료";
}

// 아래에서 올라오는 확인 시트 (브라우저 기본 confirm 대신)
function ConfirmSheet({
  pending: { booking: b, to },
  onCancel,
  onConfirm,
}: {
  pending: Pending;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const decline = to === "거절";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-t-2xl bg-white px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
      >
        <h3 className="text-[18px] font-bold">
          {decline ? `${b.name}님의 신청을 거절할까요?` : `${b.name}님의 신청을 확정으로 바꿀까요?`}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {b.date} · {b.type}
          <br />
          {decline
            ? "거절해도 지난 내역에 남아요. 나중에 자리가 생기면 문자를 보내고 다시 확정할 수 있어요."
            : "손님과 연락이 된 경우에만 바꿔주세요. 손님의 내 예약 화면에 확정으로 표시돼요."}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-[15px] font-bold">
          <button onClick={onCancel} className="rounded-xl bg-field py-3.5">
            취소
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className={`rounded-xl py-3.5 text-white ${decline ? "bg-red-600" : "bg-brand"}`}
          >
            {decline ? "거절하기" : "확정으로 바꾸기"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";
import type { Booking } from "@/lib/store";
import { canCustomerCancel, type BookingStatus } from "@/lib/bookings";
import { cancelBooking } from "@/lib/data.client";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";

const STATUS_STYLE: Record<BookingStatus, string> = {
  신청됨: "bg-brand-tint text-brand",
  확정: "bg-ink text-white",
  거절: "bg-red-50 text-red-700",
  "사용 완료": "bg-field text-muted",
  취소: "bg-field text-muted",
};

// 손님 "내 예약"의 신청 카드: 상태 · 희망 시간대 · 입장 QR · 취소
export default function BookingCard({ booking, onChange }: { booking: Booking; onChange?: (b: Booking) => void }) {
  const [status, setStatus] = useState(booking.status);
  const [qr, setQr] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleQr() {
    if (!qr) {
      // TODO(M2): 서버 서명된 입장 토큰으로 교체
      setQr(await QRCode.toDataURL(`fightmate:${booking.id}`, { width: 360, margin: 1 }));
    }
    setQrOpen((v) => !v);
  }

  async function cancel() {
    setBusy(true);
    setError(null);
    const res = await cancelBooking(booking.id);
    setBusy(false);
    setConfirming(false);
    if (res.error) return setError(res.error);
    setStatus("취소");
    setQrOpen(false);
    onChange?.({ ...booking, status: "취소" });
  }

  const active = canCustomerCancel(status);

  return (
    <li className={`rounded-xl border border-line bg-white p-4 ${status === "취소" ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold">{booking.gymName}</p>
          <p className="mt-1 text-[13px] text-muted tabular-nums">
            {booking.type} · {booking.date}
            {booking.preferredTime && booking.preferredTime !== "상관없음" && ` ${booking.preferredTime}`} · {booking.name}
          </p>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-1 text-[12px] font-semibold ${STATUS_STYLE[status]}`}>
          {status === "신청됨" ? "확인 중" : status}
        </span>
      </div>

      {status === "거절" && (
        <div className="mt-3 rounded-lg bg-field px-3 py-3 text-[13px] leading-relaxed">
          체육관 사정으로 이번 신청은 어려워요. 자리가 생기면 체육관에서 먼저 연락드릴 수 있어요.
          <Link href={`/gym/${booking.gymId}`} className="mt-1 block font-semibold text-brand">
            다른 날짜로 다시 신청하기
          </Link>
        </div>
      )}

      {active && (
        <div className="mt-3 grid grid-cols-[1.6fr_1fr] gap-2 text-[14px] font-semibold">
          <button onClick={toggleQr} className="flex items-center justify-center gap-1.5 rounded-lg bg-field py-2.5 active:bg-line">
            <QrCode size={16} />
            {qrOpen ? "QR 접기" : "입장 QR 보기"}
          </button>
          <button onClick={() => setConfirming(true)} className="rounded-lg border border-line py-2.5 text-muted">
            신청 취소
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}

      {qrOpen && qr && (
        <div className="mt-3 flex flex-col items-center py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="입장 QR" className="h-48 w-48" />
          <p className="mt-2 text-[12px] text-muted">입장 시 직원에게 보여주세요</p>
        </div>
      )}

      {confirming && (
        <ConfirmSheet
          title="신청을 취소할까요?"
          confirmLabel="취소하기"
          cancelLabel="닫기"
          danger
          busy={busy}
          onCancel={() => setConfirming(false)}
          onConfirm={cancel}
        >
          {booking.gymName} · {booking.date} {booking.type}
          <br />
          체육관에 취소 사실이 바로 보여요. 다시 가고 싶으면 새로 신청하면 돼요.
        </ConfirmSheet>
      )}
    </li>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { QrCode, Ticket } from "lucide-react";
import { type Booking } from "@/lib/store";
import { fetchBookings } from "@/lib/data.client";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    fetchBookings().then(setBookings);
  }, []);

  return (
    <main className="min-h-dvh">
      <header className="bg-white px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-4">
        <h1 className="text-[22px] font-bold">내 예약</h1>
      </header>

      {bookings === null ? null : bookings.length === 0 ? (
        <div className="flex flex-col items-center px-6 pt-24 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-field">
            <Ticket size={28} className="text-muted" />
          </span>
          <p className="mt-4 text-[15px] font-semibold">아직 예약이 없어요</p>
          <p className="mt-1 text-[13px] text-muted">체험·1일권을 전화 없이 신청해보세요</p>
          <Link href="/" className="mt-6 rounded-xl bg-brand px-6 py-3 text-[15px] font-bold text-white">
            체육관 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 p-4">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </ul>
      )}
    </main>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const [qr, setQr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function toggleQr() {
    if (!qr) {
      // TODO(M2): 서버 서명된 입장 토큰으로 교체
      setQr(await QRCode.toDataURL(`fightmate:${booking.id}`, { width: 360, margin: 1 }));
    }
    setOpen((v) => !v);
  }

  return (
    <li className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold">{booking.gymName}</p>
          <p className="mt-1 text-[13px] text-muted tabular-nums">
            {booking.type} · {booking.date} · {booking.name}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-1 text-[12px] font-semibold ${
            booking.status === "확정"
              ? "bg-ink text-white"
              : booking.status === "거절"
                ? "bg-red-50 text-red-700"
                : booking.status === "사용 완료"
                  ? "bg-field text-muted"
                  : "bg-brand-tint text-brand"
          }`}
        >
          {booking.status === "신청됨" ? "확인 중" : booking.status}
        </span>
      </div>

      {booking.status === "거절" && (
        <div className="mt-3 rounded-lg bg-field px-3 py-3 text-[13px] leading-relaxed">
          체육관 사정으로 이번 신청은 어려워요. 자리가 생기면 체육관에서 먼저 연락드릴 수 있어요.
          <Link href={`/gym/${booking.gymId}`} className="mt-1 block font-semibold text-brand">
            다른 날짜로 다시 신청하기
          </Link>
        </div>
      )}

      {(booking.status === "신청됨" || booking.status === "확정") && (
        <button
          onClick={toggleQr}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-field py-2.5 text-[14px] font-semibold active:bg-line"
        >
          <QrCode size={16} />
          {open ? "QR 접기" : "입장 QR 보기"}
        </button>
      )}

      {open && qr && (
        <div className="mt-3 flex flex-col items-center py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="입장 QR" className="h-48 w-48" />
          <p className="mt-2 text-[12px] text-muted">입장 시 직원에게 보여주세요</p>
        </div>
      )}
    </li>
  );
}

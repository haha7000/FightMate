"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { type Booking } from "@/lib/store";
import { fetchBookings } from "@/lib/data.client";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    fetchBookings().then(setBookings);
  }, []);

  if (bookings === null) return null;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-8 md:pt-12">
      <h1 className="text-xl font-bold md:text-2xl">내 예약</h1>

      {bookings.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-4xl">🎟️</p>
          <p className="mt-4 text-sm text-neutral-400">아직 예약이 없어요</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-red-600 px-6 py-3 font-bold text-white"
          >
            체육관 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
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
    <li className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{booking.gymName}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {booking.type} · {booking.date} · {booking.name}
          </p>
        </div>
        <span className="rounded-md bg-red-950 px-2 py-1 text-[11px] font-semibold text-red-300">
          {booking.status}
        </span>
      </div>

      <button
        onClick={toggleQr}
        className="mt-3 w-full rounded-xl border border-neutral-800 py-2.5 text-sm font-medium text-neutral-300 active:bg-neutral-800"
      >
        {open ? "QR 접기" : "입장 QR 보기"}
      </button>

      {open && qr && (
        <div className="mt-3 flex flex-col items-center rounded-xl bg-white p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="입장 QR" className="h-44 w-44" />
          <p className="mt-2 text-xs font-medium text-neutral-500">
            입장 시 직원에게 보여주세요
          </p>
        </div>
      )}
    </li>
  );
}

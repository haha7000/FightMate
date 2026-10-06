"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Ticket } from "lucide-react";
import { type Booking } from "@/lib/store";
import { dateParts, type GymEvent } from "@/lib/events";
import { fetchBookings, fetchMyEvents } from "@/lib/data.client";
import BookingCard from "@/components/BookingCard";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [events, setEvents] = useState<GymEvent[]>([]);

  useEffect(() => {
    fetchBookings().then(setBookings);
    fetchMyEvents()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const empty = bookings !== null && bookings.length === 0 && events.length === 0;

  return (
    <main className="min-h-dvh">
      <header className="bg-white px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-4">
        <h1 className="text-[22px] font-bold">내 예약</h1>
      </header>

      {empty && (
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
      )}

      {events.length > 0 && (
        <section className="px-4 pt-5">
          <h2 className="text-[15px] font-bold">신청한 이벤트</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {events.map((e) => {
              const p = dateParts(e.date);
              return (
                <li key={e.id}>
                  <Link href={`/event/${e.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 active:bg-field">
                    <span className="w-12 shrink-0 rounded-lg bg-night py-1.5 text-center text-white">
                      <span className="block font-num text-[18px] leading-tight">
                        {p.m}.{p.d}
                      </span>
                      <span className="block font-num text-[10px] tracking-[0.15em] text-brand-bright">{p.en}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold">{e.title}</span>
                      <span className="flex items-center gap-1 text-[12px] text-muted">
                        <CalendarDays size={12} /> {e.kind} · {e.startTime} · {e.gymName}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {bookings && bookings.length > 0 && (
        <section className="px-4 pt-5 pb-4">
          {events.length > 0 && <h2 className="text-[15px] font-bold">체험·1일권</h2>}
          <ul className="mt-2 flex flex-col gap-2">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

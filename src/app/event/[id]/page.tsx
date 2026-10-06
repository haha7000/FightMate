import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { getEventById, getGymById } from "@/lib/data.server";
import {
  EVENT_KIND_EN,
  dateParts,
  eventGiType,
  eventLevel,
  formatEventDate,
  isFull,
  seatsLeft,
} from "@/lib/events";
import RsvpButton from "@/components/RsvpButton";
import { formatWon } from "@/lib/format";

interface Props {
  params: Promise<{ id: string }>;
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return {};
  return {
    title: `${event.title} — ${event.gymName} | FightMate`,
    description: `${formatEventDate(event.date)} ${event.startTime} · ${event.gymName} · ${formatWon(event.fee)}`,
    openGraph: {
      title: event.title,
      description: `${formatEventDate(event.date)} ${event.startTime} · ${event.gymName}`,
      images: event.posterUrl ? [event.posterUrl] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();
  const gym = await getGymById(event.gymId);
  const p = dateParts(event.date);
  const gi = eventGiType(event, gym?.disciplines);
  const level = eventLevel(event);
  const left = seatsLeft(event);

  return (
    <main className="grain min-h-dvh bg-night pb-[calc(7rem+env(safe-area-inset-bottom))] text-white">
      <header className="flex items-center px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <Link href="/events" aria-label="일정 목록" className="flex h-10 w-10 items-center justify-center">
          <ChevronLeft size={26} />
        </Link>
      </header>

      {event.posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.posterUrl} alt={`${event.title} 포스터`} className="mx-5 mt-2 w-[calc(100%-2.5rem)] object-cover" />
      )}

      <section className="px-5 pt-4">
        <p className="font-num text-[13px] tracking-[0.22em] text-white/55">
          {EVENT_KIND_EN[event.kind] ?? event.kind}
        </p>
        <div className="mt-3 flex items-end gap-3">
          <p className="font-num text-[64px] leading-[0.9]">
            {p.m}.{p.d}
          </p>
          <p className="pb-1 font-num text-[16px] tracking-[0.2em] text-brand-bright">
            {p.en} · {event.startTime}
          </p>
        </div>
        <h1 className="mt-4 font-display text-[32px] leading-[1.12]">{event.title}</h1>
        {gym ? (
          <Link href={`/gym/${gym.id}`} className="mt-2 inline-block text-[14px] text-white/70 underline underline-offset-4">
            {event.gymName}
          </Link>
        ) : (
          <p className="mt-2 text-[14px] text-white/70">{event.gymName}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
          {gi && <span className="border border-white/35 px-2 py-1 font-num tracking-[0.15em]">{gi}</span>}
          {level && <span className="border border-white/20 px-2 py-1 text-white/75">{level}</span>}
          {event.openToVisitors && (
            <span className="border border-white/20 px-2 py-1 text-white/75">다른 체육관 수련자 환영</span>
          )}
        </div>
      </section>

      <dl className="mt-7 grid grid-cols-2 border-y border-white/15">
        <div className="border-r border-white/15 px-5 py-4">
          <dd className={`font-num text-[28px] leading-none ${event.fee === 0 ? "text-brand-bright" : ""}`}>
            {event.fee === 0 ? "FREE" : event.fee.toLocaleString("ko-KR")}
          </dd>
          <dt className="mt-1.5 text-[12px] text-white/50">참가비{event.fee > 0 && " (원)"}</dt>
        </div>
        <div className="px-5 py-4">
          <dd className={`font-num text-[28px] leading-none ${isFull(event) ? "text-white/40" : ""}`}>
            {event.capacity == null ? "OPEN" : isFull(event) ? "SOLD OUT" : `${event.attendees}/${event.capacity}`}
          </dd>
          <dt className="mt-1.5 text-[12px] text-white/50">
            {event.capacity == null ? "정원 제한 없음" : isFull(event) ? "정원 마감" : `${left}자리 남음`}
          </dt>
        </div>
      </dl>

      <section className="px-5 pt-6">
        {gym && (
          <p className="text-[14px] text-white/70">
            <span className="mr-2 font-num tracking-[0.15em] text-white/45">PLACE</span>
            {gym.address}
          </p>
        )}
        <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-white/85">{event.description}</p>
      </section>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-white/10 bg-night/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        <RsvpButton event={event} />
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEventById, getGymById } from "@/lib/data.server";
import {
  MOCK_EVENTS,
  eventKindEmoji,
  eventKindStyle,
  formatEventDate,
  formatFee,
} from "@/lib/events";
import InterestButton from "@/components/InterestButton";

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return MOCK_EVENTS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return {};
  return {
    title: `${event.title} — ${event.gymName} | FightMate`,
    description: `${formatEventDate(event.date)} ${event.startTime} · ${event.gymName} · ${formatFee(event.fee)}`,
    openGraph: {
      title: `${eventKindEmoji(event.kind)} ${event.title}`,
      description: `${formatEventDate(event.date)} · ${event.gymName}`,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();
  const gym = await getGymById(event.gymId);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-6 md:pb-16 md:pt-10">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← 목록으로
      </Link>

      <div className="mt-5 flex items-center gap-2">
        <span
          className={`rounded-md px-2 py-1 text-xs font-semibold ${eventKindStyle(
            event.kind
          )}`}
        >
          {eventKindEmoji(event.kind)} {event.kind}
        </span>
        {event.openToVisitors && (
          <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
            타 체육관 방문 환영
          </span>
        )}
      </div>

      <h1 className="mt-3 text-xl font-bold leading-snug md:text-2xl">
        {event.title}
      </h1>

      <Link
        href={`/gym/${event.gymId}`}
        className="mt-2 inline-block text-sm text-orange-600"
      >
        {event.gymName} →
      </Link>

      <dl className="mt-6 overflow-hidden rounded-xl border border-neutral-200">
        <Row label="일시" value={`${formatEventDate(event.date)} ${event.startTime}`} />
        <Row label="참가비" value={formatFee(event.fee)} highlight={event.fee === 0} />
        <Row
          label="정원"
          value={event.capacity ? `${event.capacity}명` : "제한 없음"}
        />
        {gym && <Row label="장소" value={gym.address} />}
      </dl>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-neutral-600">상세 안내</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {event.description}
        </p>
      </section>

      {/* 모바일: 하단 고정 / 데스크톱: 인라인 */}
      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-neutral-50/95 p-4 backdrop-blur md:static md:mt-8 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-2xl">
          <InterestButton eventId={event.id} />
          <p className="mt-2 text-center text-xs text-neutral-400 md:mb-0">
            참가 신청은 체육관에 문의하세요. (온라인 신청 준비 중)
          </p>
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 last:border-b-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? "text-orange-600" : ""}`}>
        {value}
      </span>
    </div>
  );
}

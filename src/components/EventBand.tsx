import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PosterEventRow from "@/components/PosterEventRow";
import type { Gym } from "@/lib/gyms";
import type { GymEvent } from "@/lib/events";

// 밝은 화면 사이의 검은 포스터 띠 — 오픈매트·세미나·대회 (홈·체육관 상세)
export default function EventBand({
  events,
  gyms,
  title = "이번 주, 남의 매트로.",
  limit = 3,
  showGym = true,
}: {
  events: GymEvent[];
  gyms: Gym[];
  title?: string;
  limit?: number;
  showGym?: boolean;
}) {
  if (events.length === 0) return null;
  const disciplinesOf = (gymId: string) => gyms.find((g) => g.id === gymId)?.disciplines ?? [];

  return (
    <section className="grain bg-night px-5 pt-7 pb-3 text-white">
      <p className="font-num text-[12px] tracking-[0.24em] text-brand-bright">OPEN MATS & EVENTS</p>
      <h2 className="mt-2 font-display text-[28px] leading-[1.1]">{title}</h2>
      <ul className="mt-3">
        {events.slice(0, limit).map((e) => (
          <li key={e.id}>
            <PosterEventRow event={e} gymDisciplines={disciplinesOf(e.gymId)} showGym={showGym} />
          </li>
        ))}
      </ul>
      {events.length > limit && (
        <Link
          href="/events"
          className="flex items-center justify-between py-4 text-[14px] font-semibold text-white/80"
        >
          일정 {events.length}개 전체 보기
          <ArrowRight size={18} />
        </Link>
      )}
    </section>
  );
}

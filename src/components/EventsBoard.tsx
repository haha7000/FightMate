"use client";

import { useState } from "react";
import PosterEventRow from "@/components/PosterEventRow";
import type { Gym } from "@/lib/gyms";
import { EVENT_KINDS, weekBucket, type EventKind, type GymEvent } from "@/lib/events";
import { Chip } from "@/components/ui/Chip";

type Range = "this" | "next" | "all";
const RANGES: { key: Range; label: string }[] = [
  { key: "this", label: "THIS WEEK" },
  { key: "next", label: "NEXT WEEK" },
  { key: "all", label: "ALL" },
];

// 이벤트 탭 — 전체가 검은 포스터 화면. 기간 탭 · 종류 칩 · 무료/외부인 토글
export default function EventsBoard({
  events,
  gyms,
  today,
}: {
  events: GymEvent[];
  gyms: Gym[];
  today: string;
}) {
  const countOf = (r: Range) =>
    r === "all" ? events.length : events.filter((e) => weekBucket(e.date, today) === r).length;
  // 이번 주 일정이 없으면(예: 일요일) 다음 주부터 보여준다
  const [range, setRange] = useState<Range>(() =>
    countOf("this") > 0 ? "this" : countOf("next") > 0 ? "next" : "all"
  );
  const [kind, setKind] = useState<EventKind | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [visitorsOnly, setVisitorsOnly] = useState(false);

  const visible = events.filter(
    (e) =>
      (range === "all" || weekBucket(e.date, today) === range) &&
      (!kind || e.kind === kind) &&
      (!freeOnly || e.fee === 0) &&
      (!visitorsOnly || e.openToVisitors)
  );
  const disciplinesOf = (gymId: string) => gyms.find((g) => g.id === gymId)?.disciplines ?? [];

  return (
    <main className="grain min-h-dvh bg-night text-white">
      <header className="px-5 pt-[calc(env(safe-area-inset-top)+1.75rem)] pb-5">
        <p className="font-num text-[12px] tracking-[0.24em] text-brand-bright">OPEN MATS & EVENTS</p>
        <h1 className="mt-2 font-display text-[34px] leading-[1.08]">이번 주, 남의 매트로.</h1>
        <p className="mt-2 text-[13px] text-white/55">오픈매트·세미나·대회. 다른 체육관 매트도 밟아보세요.</p>
      </header>

      <div className="sticky top-0 z-10 bg-night/95 px-5 backdrop-blur">
        <div className="flex gap-5 border-b border-white/15">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              aria-pressed={range === r.key}
              className={`-mb-px border-b-2 pb-2.5 font-num text-[14px] tracking-[0.12em] ${
                range === r.key ? "border-brand-bright text-white" : "border-transparent text-white/40"
              }`}
            >
              {r.label}
              <span className="ml-1 text-white/35">{countOf(r.key)}</span>
            </button>
          ))}
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto py-3">
          <Chip tone="dark" active={kind === null} onClick={() => setKind(null)}>
            전체
          </Chip>
          {EVENT_KINDS.map((k) => (
            <Chip key={k.key} tone="dark" active={kind === k.key} onClick={() => setKind(k.key)}>
              {k.key}
            </Chip>
          ))}
          <span className="mx-0.5 w-px shrink-0 self-stretch bg-white/15" aria-hidden />
          <Chip tone="dark" active={freeOnly} onClick={() => setFreeOnly((v) => !v)}>
            무료만
          </Chip>
          <Chip tone="dark" active={visitorsOnly} onClick={() => setVisitorsOnly((v) => !v)}>
            외부인 가능
          </Chip>
        </div>
      </div>

      <ul className="px-5 pb-6">
        {visible.map((e) => (
          <li key={e.id}>
            <PosterEventRow event={e} gymDisciplines={disciplinesOf(e.gymId)} />
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <div className="px-5 py-20 text-center">
          <p className="font-num text-[40px] tracking-[0.1em] text-white/20">NO EVENTS</p>
          <p className="mt-3 text-[14px] text-white/55">
            {events.length === 0 ? "예정된 일정이 아직 없어요" : "조건에 맞는 일정이 없어요"}
          </p>
        </div>
      )}
    </main>
  );
}


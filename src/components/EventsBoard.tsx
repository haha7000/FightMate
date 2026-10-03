"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  EVENT_KINDS,
  eventKindEmoji,
  eventKindStyle,
  formatEventDate,
  formatFee,
  isAlmostFull,
  isFull,
  seatsLeft,
  type EventKind,
  type GymEvent,
} from "@/lib/events";

// 이벤트 탭: 오픈매트·세미나·대회를 날짜별로. events는 이미 날짜순 정렬돼 들어온다.
export default function EventsBoard({ events }: { events: GymEvent[] }) {
  const [kind, setKind] = useState<EventKind | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [visitorsOnly, setVisitorsOnly] = useState(false);

  const visible = events.filter(
    (e) =>
      (!kind || e.kind === kind) &&
      (!freeOnly || e.fee === 0) &&
      (!visitorsOnly || e.openToVisitors)
  );

  // 같은 날짜끼리 묶기
  const byDate = useMemo(() => {
    const groups: { date: string; items: GymEvent[] }[] = [];
    for (const e of visible) {
      const last = groups.at(-1);
      if (last?.date === e.date) last.items.push(e);
      else groups.push({ date: e.date, items: [e] });
    }
    return groups;
  }, [visible]);

  return (
    <main className="mx-auto max-w-3xl pb-16">
      <header className="px-5 pt-8 pb-4 md:pt-14">
        <h1 className="display text-[2.2rem] md:text-5xl">이벤트</h1>
        <p className="mt-3 text-sm text-neutral-500 md:text-base">
          오픈매트·세미나·대회 — 다른 체육관 매트도 밟아보세요.
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto px-5 pb-2">
        <Chip label="전체" active={kind === null} onClick={() => setKind(null)} />
        {EVENT_KINDS.map((k) => (
          <Chip
            key={k.key}
            label={`${k.emoji} ${k.key}`}
            active={kind === k.key}
            onClick={() => setKind(k.key)}
          />
        ))}
      </nav>
      <div className="flex gap-2 px-5 pb-4">
        <Toggle label="무료만" on={freeOnly} onClick={() => setFreeOnly((v) => !v)} />
        <Toggle
          label="외부인 참가 가능"
          on={visitorsOnly}
          onClick={() => setVisitorsOnly((v) => !v)}
        />
      </div>

      {byDate.length === 0 ? (
        <div className="px-5 py-20 text-center">
          <p className="text-4xl">🗓️</p>
          <p className="mt-4 text-sm text-neutral-500">
            {events.length === 0 ? "예정된 이벤트가 아직 없어요" : "조건에 맞는 이벤트가 없어요"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 md:px-5">
          {byDate.map((group) => (
            <section key={group.date}>
              {/* 스크롤해도 날짜가 위에 붙어 있도록 */}
              <h2 className="sticky top-0 z-10 -mx-4 bg-neutral-50/90 px-4 py-2 text-sm font-extrabold text-neutral-900 backdrop-blur md:-mx-5 md:px-5">
                {formatEventDate(group.date)}
                <span className="ml-1.5 font-medium text-neutral-400">{group.items.length}</span>
              </h2>
              <ul className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-2">
                {group.items.map((e) => (
                  <li key={e.id}>
                    <EventRow event={e} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-neutral-900 text-white" : "border border-neutral-200 bg-white text-neutral-600"
      }`}
    >
      {label}
    </button>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        on ? "bg-orange-500 text-white" : "border border-orange-200 bg-orange-50 text-orange-700"
      }`}
    >
      {on ? "✓ " : ""}
      {label}
    </button>
  );
}

// 한 줄짜리 이벤트 행: 종류 타일 · 제목/체육관 · 참가비/잔여석
function EventRow({ event: e }: { event: GymEvent }) {
  const left = seatsLeft(e);
  return (
    <Link
      href={`/event/${e.id}`}
      className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-neutral-200/80 active:bg-neutral-50"
    >
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl ${eventKindStyle(e.kind)}`}
      >
        {e.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.posterUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          eventKindEmoji(e.kind)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-neutral-500">
          {e.kind} · {e.startTime}
          {e.openToVisitors && <span className="text-emerald-600"> · 방문 환영</span>}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug">{e.title}</h3>
        <p className="mt-0.5 truncate text-xs text-neutral-500">{e.gymName}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold ${e.fee === 0 ? "text-orange-600" : "text-neutral-900"}`}>
          {formatFee(e.fee)}
        </p>
        {e.capacity != null && (
          <p
            className={`mt-0.5 text-[11px] font-semibold ${
              isFull(e) ? "text-neutral-400" : isAlmostFull(e) ? "text-orange-600" : "text-neutral-500"
            }`}
          >
            {isFull(e) ? "마감" : isAlmostFull(e) ? `${left}자리 남음` : `${e.attendees}/${e.capacity}명`}
          </p>
        )}
      </div>
    </Link>
  );
}

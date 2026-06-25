"use client";

import { useState } from "react";
import { EVENT_KINDS, type EventKind, type GymEvent } from "@/lib/events";
import EventCard from "@/components/EventCard";

export default function EventFeed({ events }: { events: GymEvent[] }) {
  const [kind, setKind] = useState<EventKind | null>(null);

  if (events.length === 0) return null;

  const visible = kind ? events.filter((e) => e.kind === kind) : events;

  return (
    <section className="mb-2 pt-2">
      <div className="flex items-baseline justify-between px-5">
        <h2 className="display text-2xl md:text-3xl">🔥 다가오는 이벤트</h2>
        <span className="text-sm text-neutral-400">{events.length}건</span>
      </div>

      <nav className="mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
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

      {/* 가로 스크롤 카드 */}
      <ul className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2">
        {visible.map((ev) => (
          <li key={ev.id} className="w-72 shrink-0">
            <EventCard event={ev} showGym />
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="px-5 py-6 text-center text-sm text-neutral-400">
          해당 종류의 이벤트가 없어요
        </p>
      )}
    </section>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-neutral-900 text-white"
          : "border border-neutral-200 bg-white text-neutral-600"
      }`}
    >
      {label}
    </button>
  );
}

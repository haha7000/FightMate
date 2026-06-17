"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DISCIPLINES,
  formatPrice,
  isHandsFree,
  type Discipline,
  type Gym,
} from "@/lib/gyms";

export default function GymList({ gyms }: { gyms: Gym[] }) {
  const [filter, setFilter] = useState<Discipline | null>(null);

  const visible = filter
    ? gyms.filter((g) => g.disciplines.includes(filter))
    : gyms;

  return (
    <>
      <nav className="flex gap-2 overflow-x-auto px-5 pb-4 md:flex-wrap md:overflow-visible md:pb-6">
        <FilterChip
          label="전체"
          active={filter === null}
          onClick={() => setFilter(null)}
        />
        {DISCIPLINES.map((d) => (
          <FilterChip
            key={d}
            label={d}
            active={filter === d}
            onClick={() => setFilter(d)}
          />
        ))}
      </nav>

      <ul className="grid grid-cols-1 gap-3 px-5 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {visible.map((gym) => (
          <li key={gym.id}>
            <Link
              href={`/gym/${gym.id}`}
              className="block h-full rounded-2xl border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700 hover:bg-neutral-800/70 active:bg-neutral-800"
            >
              <div className="flex items-start gap-3">
                {gym.photos.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gym.photos[0].src}
                    alt={gym.name}
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-2xl">
                    {gym.emoji}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">{gym.name}</h2>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {gym.district} · ⭐ {gym.rating} ({gym.reviewCount})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {gym.disciplines.map((d) => (
                      <span
                        key={d}
                        className="rounded-md bg-neutral-800 px-1.5 py-0.5 text-[11px] text-neutral-300"
                      >
                        {d}
                      </span>
                    ))}
                    {isHandsFree(gym) && (
                      <span className="rounded-md bg-red-950 px-1.5 py-0.5 text-[11px] font-medium text-red-300">
                        🙌 몸만 와도 OK
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-neutral-500">체험</p>
                  <p
                    className={`text-sm font-bold ${
                      gym.trialPrice === 0 ? "text-red-400" : ""
                    }`}
                  >
                    {formatPrice(gym.trialPrice)}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="px-5 py-16 text-center text-sm text-neutral-500">
          해당 종목의 체육관이 아직 없어요
        </p>
      )}
    </>
  );
}

function FilterChip({
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
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-red-600 text-white"
          : "border border-neutral-800 bg-neutral-900 text-neutral-300"
      }`}
    >
      {label}
    </button>
  );
}

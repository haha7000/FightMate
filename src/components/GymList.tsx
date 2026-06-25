"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DISCIPLINES,
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

      <ul className="grid grid-cols-1 gap-5 px-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {visible.map((gym) => (
          <li key={gym.id}>
            <Link
              href={`/gym/${gym.id}`}
              className="group block overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              {/* 큰 이미지 */}
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                {gym.photos.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gym.photos[0].src}
                    alt={gym.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl">
                    {gym.emoji}
                  </div>
                )}
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  {gym.trialPrice === 0 && (
                    <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-bold text-white shadow">
                      체험 무료
                    </span>
                  )}
                  {isHandsFree(gym) && (
                    <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-neutral-900 shadow">
                      🙌 몸만 와도 OK
                    </span>
                  )}
                </div>
              </div>

              {/* 정보 */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-extrabold leading-tight tracking-tight">
                    {gym.name}
                  </h3>
                  <span className="shrink-0 pt-0.5 text-sm font-bold text-neutral-700">
                    ⭐ {gym.rating}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {gym.district} · 리뷰 {gym.reviewCount}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {gym.disciplines.map((d) => (
                    <span
                      key={d}
                      className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="px-5 py-16 text-center text-sm text-neutral-400">
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
          ? "bg-orange-500 text-white"
          : "border border-neutral-200 bg-white text-neutral-600"
      }`}
    >
      {label}
    </button>
  );
}

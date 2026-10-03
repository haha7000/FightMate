"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DISCIPLINES,
  formatPriceShort,
  isHandsFree,
  offersDayPass,
  type Discipline,
  type Gym,
} from "@/lib/gyms";

export default function GymList({ gyms }: { gyms: Gym[] }) {
  const [filter, setFilter] = useState<Discipline | null>(null);
  const [dayPassOnly, setDayPassOnly] = useState(false);

  const visible = gyms.filter(
    (g) =>
      (!filter || g.disciplines.includes(filter)) &&
      (!dayPassOnly || offersDayPass(g))
  );

  return (
    <>
      <nav className="flex gap-2 overflow-x-auto px-5 pb-4 md:flex-wrap md:overflow-visible md:pb-6">
        {/* 차별점: 다른 체육관 수련자도 하루 운동하러 갈 수 있는 곳만 */}
        <button
          onClick={() => setDayPassOnly((v) => !v)}
          aria-pressed={dayPassOnly}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${
            dayPassOnly
              ? "bg-neutral-900 text-white"
              : "border border-neutral-900 bg-white text-neutral-900"
          }`}
        >
          🎟️ 1일권 가능
        </button>
        <span className="w-px shrink-0 self-stretch bg-neutral-200" aria-hidden />
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

      {/* 폰 2열 · 태블릿 3열 · 데스크톱 4열. 테두리 없이 사진 중심 카드 */}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 px-4 sm:grid-cols-3 md:gap-x-5 md:px-5 lg:grid-cols-4">
        {visible.map((gym) => (
          <li key={gym.id}>
            <Link href={`/gym/${gym.id}`} className="group block active:opacity-80">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
                {gym.photos.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gym.photos[0].src}
                    alt={gym.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">
                    {gym.emoji}
                  </div>
                )}
                {gym.trialPrice === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    체험 무료
                  </span>
                )}
                {isHandsFree(gym) && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                    🙌 몸만 와도 OK
                  </span>
                )}
              </div>

              <div className="mt-2 px-0.5">
                <h3 className="truncate text-[15px] font-bold leading-snug tracking-tight" title={gym.name}>
                  {gym.name}
                </h3>
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  <span className="font-semibold text-neutral-800">★ {gym.rating}</span>
                  <span className="text-neutral-400"> ({gym.reviewCount})</span>
                  {" · "}
                  {gym.district.split(" ").at(-1)} · {gym.disciplines.join("·")}
                </p>
                <p className="mt-1 text-[13px]">
                  <span className="font-bold">체험 {formatPriceShort(gym.trialPrice)}</span>
                  {offersDayPass(gym) && (
                    <span className="text-neutral-500"> · 1일권 {formatPriceShort(gym.dayPassPrice!)}</span>
                  )}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="px-5 py-16 text-center text-sm text-neutral-400">
          {dayPassOnly ? "조건에 맞는 1일권 체육관이 아직 없어요" : "해당 종목의 체육관이 아직 없어요"}
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

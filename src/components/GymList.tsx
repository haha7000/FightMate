"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Star, Ticket } from "lucide-react";
import { DISCIPLINES, offersDayPass, type Discipline, type Gym } from "@/lib/gyms";
import { dateParts, type GymEvent } from "@/lib/events";

// 홈 체육관 목록: 필터 칩 + 폰 2열 카드. 카드마다 "다음 일정" 칩 (캐치테이블의 예약 가능 시간 칩처럼)
export default function GymList({ gyms, events }: { gyms: Gym[]; events: GymEvent[] }) {
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [dayPassOnly, setDayPassOnly] = useState(false);
  const [freeTrialOnly, setFreeTrialOnly] = useState(false);

  const visible = gyms.filter(
    (g) =>
      (!discipline || g.disciplines.includes(discipline)) &&
      (!dayPassOnly || offersDayPass(g)) &&
      (!freeTrialOnly || g.trialPrice === 0)
  );

  return (
    <section className="pt-6">
      <div className="flex items-baseline justify-between px-4">
        <h2 className="text-[18px] font-bold">체육관</h2>
        <span className="text-[13px] text-muted">{visible.length}곳</span>
      </div>

      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <Toggle on={dayPassOnly} onClick={() => setDayPassOnly((v) => !v)}>
          <Ticket size={14} strokeWidth={2} />
          1일권 가능
        </Toggle>
        <Toggle on={freeTrialOnly} onClick={() => setFreeTrialOnly((v) => !v)}>
          체험 무료
        </Toggle>
        <span className="mx-0.5 w-px shrink-0 self-stretch bg-line" aria-hidden />
        <Toggle on={discipline === null} onClick={() => setDiscipline(null)}>
          전체
        </Toggle>
        {DISCIPLINES.map((d) => (
          <Toggle key={d} on={discipline === d} onClick={() => setDiscipline(d)}>
            {d}
          </Toggle>
        ))}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6 px-4">
        {visible.map((g) => {
          const next = events.find((e) => e.gymId === g.id);
          return (
            <li key={g.id}>
              <Link href={`/gym/${g.id}`} className="block active:opacity-80">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-field">
                  {g.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.photos[0].src} alt={g.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-[22px] text-muted">
                      {g.name.slice(0, 2)}
                    </div>
                  )}
                  {g.trialPrice === 0 && (
                    <span className="absolute left-2 top-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[11px] font-bold text-brand">
                      체험 무료
                    </span>
                  )}
                </div>
                <h3 className="mt-2 truncate text-[15px] font-semibold">{g.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted">
                  <Star size={12} className="shrink-0 fill-star stroke-star" />
                  <b className="font-semibold text-ink">{g.rating}</b>({g.reviewCount}) ·{" "}
                  {g.district.split(" ").at(-1)}
                </p>
                <p className="mt-1 text-[13px] tabular-nums">
                  {offersDayPass(g) ? (
                    <>
                      1일권 <b>{g.dayPassPrice!.toLocaleString("ko-KR")}원</b>
                    </>
                  ) : (
                    <span className="text-muted">1일권 없음</span>
                  )}
                </p>
                {next && (
                  <span className="mt-2 inline-flex max-w-full items-center gap-1 truncate rounded-md bg-brand-tint px-2 py-1 text-[12px] font-semibold text-brand">
                    <CalendarDays size={13} className="shrink-0" />
                    {dateParts(next.date).ko} {next.startTime} {next.kind}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p className="px-4 py-16 text-center text-[14px] text-muted">조건에 맞는 체육관이 아직 없어요</p>
      )}
    </section>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium ${
        on ? "border-transparent bg-ink text-white" : "border-line bg-white text-ink"
      }`}
    >
      {children}
    </button>
  );
}

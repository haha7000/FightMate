"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Search, Star, Ticket, X } from "lucide-react";
import { DISCIPLINES, filterGyms, hasReviews, offersDayPass, regionsOf, type Discipline, type Gym } from "@/lib/gyms";
import { dateParts, type GymEvent } from "@/lib/events";
import { Chip } from "@/components/ui/Chip";

// 홈 체육관 목록: 검색 + 지역 + 필터 칩 + 폰 2열 카드. 카드마다 "다음 일정" 칩 (캐치테이블의 예약 가능 시간 칩처럼)
export default function GymList({ gyms, events }: { gyms: Gym[]; events: GymEvent[] }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string | null>(null);
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [dayPassOnly, setDayPassOnly] = useState(false);
  const [freeTrialOnly, setFreeTrialOnly] = useState(false);

  const regions = regionsOf(gyms);
  const visible = filterGyms(gyms, { query, region, discipline, dayPassOnly, freeTrialOnly });
  const filtered = !!(query || region || discipline || dayPassOnly || freeTrialOnly);

  function reset() {
    setQuery("");
    setRegion(null);
    setDiscipline(null);
    setDayPassOnly(false);
    setFreeTrialOnly(false);
  }

  return (
    <section className="pt-6">
      <div className="flex items-baseline justify-between px-4">
        <h2 className="text-[18px] font-bold">체육관</h2>
        <span className="text-[13px] text-muted">{visible.length}곳</span>
      </div>

      <label className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-line focus-within:ring-brand">
        <Search size={17} className="shrink-0 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="체육관 이름, 동네, 종목 검색"
          aria-label="체육관 검색"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기" className="text-muted">
            <X size={16} />
          </button>
        )}
      </label>

      {regions.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto px-4" role="group" aria-label="지역">
          <Chip active={region === null} onClick={() => setRegion(null)}>
            모든 지역
          </Chip>
          {regions.map((r) => (
            <Chip key={r} active={region === r} onClick={() => setRegion(region === r ? null : r)}>
              {r}
            </Chip>
          ))}
        </div>
      )}

      <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <Chip active={dayPassOnly} onClick={() => setDayPassOnly((v) => !v)}>
          <Ticket size={14} strokeWidth={2} />
          1일권 가능
        </Chip>
        <Chip active={freeTrialOnly} onClick={() => setFreeTrialOnly((v) => !v)}>
          체험 무료
        </Chip>
        <span className="mx-0.5 w-px shrink-0 self-stretch bg-line" aria-hidden />
        <Chip active={discipline === null} onClick={() => setDiscipline(null)}>
          전체
        </Chip>
        {DISCIPLINES.map((d) => (
          <Chip key={d} active={discipline === d} onClick={() => setDiscipline(d)}>
            {d}
          </Chip>
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
                  {hasReviews(g) ? (
                    <>
                      <Star size={12} className="shrink-0 fill-star stroke-star" />
                      <b className="font-semibold text-ink">{g.rating}</b>({g.reviewCount})
                    </>
                  ) : (
                    <b className="font-semibold text-brand">새로 입점</b>
                  )}{" "}
                  · {g.district.split(" ").at(-1)}
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
        <div className="px-4 py-16 text-center text-[14px] text-muted">
          <p>{query ? `"${query}"에 맞는 체육관이 없어요` : "조건에 맞는 체육관이 아직 없어요"}</p>
          {filtered && (
            <button onClick={reset} className="mt-3 rounded-lg bg-field px-4 py-2 text-[13px] font-semibold text-ink">
              조건 초기화
            </button>
          )}
          <Link href="/map" className="mt-2 block text-[13px] font-semibold text-brand">
            지도에서 주변 체육관 찾아보기
          </Link>
        </div>
      )}
    </section>
  );
}


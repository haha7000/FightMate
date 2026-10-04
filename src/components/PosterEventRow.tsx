import Link from "next/link";
import {
  EVENT_KIND_EN,
  dateParts,
  eventGiType,
  eventLevel,
  isFull,
  type GymEvent,
} from "@/lib/events";

// 검은 포스터 띠 안의 이벤트 한 줄: 날짜 도장 · 종류/시간 · 제목 · 태그 · 신청 현황
export default function PosterEventRow({
  event: e,
  gymDisciplines = [],
  showGym = true,
}: {
  event: GymEvent;
  gymDisciplines?: string[];
  showGym?: boolean;
}) {
  const p = dateParts(e.date);
  const gi = eventGiType(e, gymDisciplines);
  const level = eventLevel(e);
  const full = isFull(e);

  return (
    <Link href={`/event/${e.id}`} className="flex gap-4 border-b border-white/10 py-4 active:bg-white/5">
      <div className="w-[64px] shrink-0">
        <p className="font-num text-[30px] leading-none">
          {p.m}.{p.d}
        </p>
        <p className="mt-1 font-num text-[12px] tracking-[0.22em] text-brand-bright">{p.en}</p>
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-num text-[11px] tracking-[0.18em] text-white/50">
          {EVENT_KIND_EN[e.kind] ?? e.kind} · {e.startTime}
        </p>
        <h3 className="mt-1 font-display text-[18px] leading-snug">{e.title}</h3>
        {showGym && <p className="mt-1 truncate text-[12px] text-white/55">{e.gymName}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          {gi && (
            <span className="border border-white/35 px-1.5 py-0.5 font-num tracking-[0.15em]">{gi}</span>
          )}
          {level && <span className="border border-white/20 px-1.5 py-0.5 text-white/70">{level}</span>}
          {e.openToVisitors && (
            <span className="border border-white/20 px-1.5 py-0.5 text-white/70">외부인 가능</span>
          )}
          <span
            className={`border border-white/20 px-1.5 py-0.5 font-num tracking-[0.12em] ${
              e.fee === 0 ? "text-brand-bright" : ""
            }`}
          >
            {e.fee === 0 ? "FREE" : e.fee.toLocaleString("ko-KR")}
          </span>
        </div>
      </div>

      {e.capacity != null && (
        <div className="shrink-0 text-right">
          <p className={`font-num text-[20px] leading-none ${full ? "text-white/35" : ""}`}>
            {full ? (
              "SOLD OUT"
            ) : (
              <>
                {e.attendees}
                <span className="text-white/35">/{e.capacity}</span>
              </>
            )}
          </p>
        </div>
      )}
    </Link>
  );
}

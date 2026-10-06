"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { fetchBookingStats } from "@/lib/partner.client";
import { BOOKING_GOAL, type BookingStats } from "@/lib/stats";

// 운영자 지표: 목표 진행률 · 최근 7일 · 방문 전환 · 주별 추이 · 체육관별
export default function StatsPanel() {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingStats()
      .then(setStats)
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) return <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">지표를 불러오지 못했어요: {err}</p>;
  if (!stats) return <p className="py-6 text-center text-[14px] text-muted">지표 불러오는 중…</p>;

  const progress = Math.min(1, stats.active / BOOKING_GOAL);
  const diff = stats.last7 - stats.prev7;
  const maxWeek = Math.max(1, ...stats.weekly);

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="flex items-center gap-1.5 text-[15px] font-bold">
        <BarChart3 size={17} className="text-brand" /> 예약 지표
      </p>

      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-muted">분기 목표</span>
          <span className="text-[13px] tabular-nums">
            <b className="text-[20px] text-brand">{stats.active}</b> / {BOOKING_GOAL}건
          </span>
        </div>
        <div
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-field"
          role="progressbar"
          aria-label="목표 진행률"
          aria-valuenow={stats.active}
          aria-valuemax={BOOKING_GOAL}
        >
          <div className="h-full rounded-full bg-brand" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-muted">
          취소 뺀 체험·1일권 신청 (체험 {stats.byType.체험} · 1일권 {stats.byType["1일권"]})
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Metric label="최근 7일" value={`${stats.last7}건`} sub={diff === 0 ? "지난주와 같음" : `지난주보다 ${diff > 0 ? "+" : ""}${diff}`} />
        <Metric label="방문 완료" value={`${stats.byStatus["사용 완료"]}건`} sub={`확정 대기 ${stats.byStatus["신청됨"]}`} />
        <Metric
          label="방문 전환"
          value={stats.visitRate == null ? "—" : `${Math.round(stats.visitRate * 100)}%`}
          sub={`거절 ${stats.byStatus["거절"]} · 취소 ${stats.byStatus["취소"]}`}
        />
      </dl>

      <p className="mt-4 text-[12px] font-semibold text-muted">주별 신청 (최근 8주)</p>
      <div className="mt-1.5 flex h-16 items-end gap-1" aria-label={`주별 신청 ${stats.weekly.join(", ")}`}>
        {stats.weekly.map((n, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-0.5">
            <span className="text-[10px] tabular-nums text-muted">{n || ""}</span>
            <div
              className={`w-full rounded-sm ${i === 7 ? "bg-brand" : "bg-brand/35"}`}
              style={{ height: `${Math.max(2, (n / maxWeek) * 44)}px` }}
            />
          </div>
        ))}
      </div>

      {stats.gyms.length > 0 && (
        <>
          <p className="mt-4 text-[12px] font-semibold text-muted">체육관별 (신청 / 방문)</p>
          <ul className="mt-1 divide-y divide-line text-[13px]">
            {stats.gyms.map((g) => (
              <li key={g.gymId} className="flex items-center justify-between py-1.5">
                <span className="truncate">{g.gymName}</span>
                <span className="shrink-0 tabular-nums">
                  <b>{g.total}</b> / {g.visited}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg bg-field px-1 py-2.5">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-[17px] font-bold tabular-nums">{value}</dd>
      <dd className="mt-0.5 text-[10px] text-muted">{sub}</dd>
    </div>
  );
}

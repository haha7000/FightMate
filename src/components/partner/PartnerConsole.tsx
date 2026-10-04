"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Home } from "lucide-react";
import type { Gym } from "@/lib/gyms";
import BookingsPanel from "./BookingsPanel";
import EventsPanel from "./EventsPanel";
import GymInfoPanel from "./GymInfoPanel";
import PromotePanel from "./PromotePanel";

const TABS = [
  { key: "bookings", label: "신청" },
  { key: "events", label: "일정" },
  { key: "info", label: "체육관 정보" },
  { key: "promote", label: "홍보" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function PartnerConsole({
  gym,
  gyms,
  isAdmin,
}: {
  gym: Gym;
  gyms: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("bookings");

  return (
    <main className="min-h-dvh pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="bg-white px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-brand">
            관장 모드
            {isAdmin && <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] text-white">운영자</span>}
          </p>
          <Link href="/" aria-label="FightMate 홈" className="-mr-1 p-1 text-muted">
            <Home size={20} />
          </Link>
        </div>

        {gyms.length > 1 ? (
          <label className="relative mt-1 flex items-center">
            <select
              value={gym.id}
              onChange={(e) => router.push(`/partner?gym=${e.target.value}`)}
              className="w-full appearance-none bg-transparent pr-7 text-[22px] font-bold outline-none"
            >
              {gyms.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <ChevronDown size={20} className="pointer-events-none absolute right-0 text-muted" />
          </label>
        ) : (
          <h1 className="mt-1 text-[22px] font-bold">{gym.name}</h1>
        )}

        <Link
          href={`/gym/${gym.id}`}
          className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-muted"
        >
          손님에게 보이는 페이지 <ExternalLink size={13} />
        </Link>

        <nav className="no-scrollbar mt-4 flex gap-5 overflow-x-auto border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={`-mb-px shrink-0 border-b-2 pb-2.5 text-[15px] font-semibold ${
                tab === t.key ? "border-ink text-ink" : "border-transparent text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* 체육관을 바꾸면 패널 상태를 새로 시작 */}
      <div key={gym.id}>
        {tab === "bookings" && <BookingsPanel gymId={gym.id} />}
        {tab === "events" && <EventsPanel gym={gym} />}
        {tab === "info" && <GymInfoPanel gym={gym} />}
        {tab === "promote" && <PromotePanel gym={gym} />}
      </div>
    </main>
  );
}

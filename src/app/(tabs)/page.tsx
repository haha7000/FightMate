import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import GymList from "@/components/GymList";
import EventBand from "@/components/EventBand";
import { Wordmark } from "@/components/nav";
import { offersDayPass, regionsOf } from "@/lib/gyms";
import { getGyms, getUpcomingEvents } from "@/lib/data.server";
import { LegalLinks } from "@/components/LegalLinks";

export default async function HomePage() {
  const [gyms, events] = await Promise.all([getGyms(), getUpcomingEvents()]);
  const freeTrials = gyms.filter((g) => g.trialPrice === 0).length;
  const dayPass = gyms.filter(offersDayPass).length;
  // 입점한 지역을 많은 순으로 (예: "강남구·서초구") — 지역이 늘면 "외 N곳"
  const regions = regionsOf(gyms);
  const regionLabel =
    regions.length === 0 ? "서울" : regions.slice(0, 2).join("·") + (regions.length > 2 ? ` 외 ${regions.length - 2}곳` : "");

  return (
    <main>
      <h1 className="sr-only">FightMate — 내 주변 격투기 체육관 체험·1일권 예약</h1>
      <header className="bg-white px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[17px] font-bold">
            <MapPin size={18} strokeWidth={2.25} className="text-brand" />
            {regionLabel}
          </span>
          <Wordmark />
        </div>
        <p className="mt-4 text-[22px] font-bold leading-snug">
          전화 없이, 링크 하나로
          <br />
          체험 예약하세요
        </p>
        <p className="mt-1.5 text-[13px] text-muted">
          체육관 {gyms.length}곳 · 체험 무료 {freeTrials}곳 · 1일권 {dayPass}곳
        </p>
        <Link
          href="/map"
          className="mt-4 flex items-center gap-2 rounded-xl bg-field px-3.5 py-3 text-[15px] text-muted active:bg-line"
        >
          <Search size={18} />
          지도에서 내 주변 체육관 찾기
        </Link>
      </header>

      <GymList gyms={gyms} events={events} />

      <div className="mt-10">
        <EventBand events={events} gyms={gyms} />
      </div>

      <LegalLinks />
    </main>
  );
}

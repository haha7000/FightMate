import type { Metadata } from "next";
import EventsBoard from "@/components/EventsBoard";
import { getGyms, getUpcomingEvents } from "@/lib/data.server";
import { todayKST } from "@/lib/events";

export const metadata: Metadata = {
  title: "오픈매트·세미나·대회 일정 — FightMate",
  description:
    "이번 주 오픈매트, 게스트 코치 세미나, 아마추어 대회 일정을 한곳에서. 다른 체육관 매트도 밟아보세요.",
};

export default async function EventsPage() {
  const [events, gyms] = await Promise.all([getUpcomingEvents(), getGyms()]);
  // "이번 주" 판단 기준일을 서버에서 한 번 정해 내려준다 (서버·브라우저 날짜 불일치 방지)
  return <EventsBoard events={events} gyms={gyms} today={todayKST()} />;
}

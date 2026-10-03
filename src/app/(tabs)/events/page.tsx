import type { Metadata } from "next";
import EventsBoard from "@/components/EventsBoard";
import { getUpcomingEvents } from "@/lib/data.server";

export const metadata: Metadata = {
  title: "오픈매트·세미나·대회 일정 — FightMate",
  description:
    "이번 주 오픈매트, 게스트 코치 세미나, 아마추어 대회 일정을 한곳에서. 다른 체육관 매트도 밟아보세요.",
};

export default async function EventsPage() {
  const events = await getUpcomingEvents();
  return <EventsBoard events={events} />;
}

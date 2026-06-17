import GymList from "@/components/GymList";
import EventFeed from "@/components/EventFeed";
import { getGyms, getUpcomingEvents } from "@/lib/data.server";

export default async function HomePage() {
  const [gyms, events] = await Promise.all([getGyms(), getUpcomingEvents()]);

  return (
    <main className="mx-auto max-w-6xl pb-16">
      <header className="px-5 pt-8 pb-5 md:pt-14 md:pb-8">
        <p className="text-xs font-semibold tracking-widest text-red-500">
          FIGHTMATE
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-snug md:text-4xl">
          격투기 체험, <br className="md:hidden" />
          전화 없이 예약하세요
        </h1>
        <p className="mt-2 text-sm text-neutral-400 md:text-base">
          강남 · 서초 {gyms.length}개 체육관
        </p>
      </header>

      <EventFeed events={events} />

      <h2 className="px-5 pt-4 pb-1 text-base font-bold">체육관 둘러보기</h2>
      <GymList gyms={gyms} />
    </main>
  );
}

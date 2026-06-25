import GymList from "@/components/GymList";
import EventFeed from "@/components/EventFeed";
import { getGyms, getUpcomingEvents } from "@/lib/data.server";

export default async function HomePage() {
  const [gyms, events] = await Promise.all([getGyms(), getUpcomingEvents()]);

  return (
    <main className="mx-auto max-w-6xl pb-20">
      {/* 에디토리얼 히어로 */}
      <header className="px-5 pt-12 pb-8 md:pt-20 md:pb-12">
        <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-orange-600">
          FightMate
        </p>
        <h1 className="display mt-4 text-5xl text-neutral-950 md:text-8xl">
          지금 시작하는
          <br />
          격투기<span className="text-orange-500">.</span>
        </h1>
        <p className="mt-5 max-w-md text-base text-neutral-500 md:text-xl">
          강남·서초 {gyms.length}개 체육관. 전화 한 통 없이, 링크 하나로 체험을
          예약하세요.
        </p>
      </header>

      <EventFeed events={events} />

      <div className="mt-4 flex items-baseline justify-between px-5 pb-3 md:mt-8">
        <h2 className="display text-2xl md:text-3xl">체육관</h2>
        <span className="text-sm text-neutral-400">{gyms.length}곳</span>
      </div>
      <GymList gyms={gyms} />
    </main>
  );
}

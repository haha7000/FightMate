import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, Star, X } from "lucide-react";
import { AMENITIES, hasReviews, offersDayPass } from "@/lib/gyms";
import { getEventsByGym, getGymById } from "@/lib/data.server";
import GymPhotoCarousel from "@/components/GymPhotoCarousel";
import EventBand from "@/components/EventBand";
import ReviewSection from "@/components/ReviewSection";
import { formatWon } from "@/lib/format";
import { GymInfoRows } from "@/components/GymInfoRows";

interface Props {
  params: Promise<{ id: string }>;
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const gym = await getGymById(id);
  if (!gym) return {};
  const dayPass = offersDayPass(gym) ? ` · 1일권 ${formatWon(gym.dayPassPrice!)}` : "";
  return {
    title: `${gym.name} — FightMate`,
    description: `${gym.district} · ${gym.disciplines.join("/")} · 체험 ${formatWon(gym.trialPrice)}${dayPass}`,
    openGraph: {
      title: `${gym.name} — 체험 ${formatWon(gym.trialPrice)}`,
      description: gym.intro,
      images: gym.photos[0] ? [gym.photos[0].src] : undefined,
    },
  };
}

export default async function GymDetailPage({ params }: Props) {
  const { id } = await params;
  const gym = await getGymById(id);
  if (!gym) notFound();
  const events = await getEventsByGym(id);
  const next = events[0];
  const dayPass = offersDayPass(gym);

  return (
    <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <GymPhotoCarousel photos={gym.photos} name={gym.name} />

      <section className="relative -mt-4 rounded-t-2xl bg-white px-4 pt-5 pb-6">
        <p className="text-[13px] font-semibold text-brand">{gym.disciplines.join(" · ")}</p>
        <h1 className="mt-1 text-[22px] font-bold leading-snug">{gym.name}</h1>
        <p className="mt-1 flex items-center gap-1 text-[13px] text-muted">
          {hasReviews(gym) ? (
            <>
              <Star size={13} className="fill-star stroke-star" />
              <b className="text-ink">{gym.rating}</b> · 리뷰 {gym.reviewCount}개
            </>
          ) : (
            <b className="text-brand">새로 입점</b>
          )}{" "}
          · {gym.district}
        </p>

        <GymInfoRows gym={gym} next={next} />

        {gym.intro && <p className="mt-5 text-[14px] leading-relaxed text-ink/80">{gym.intro}</p>}
      </section>

      {gym.timetableUrl && (
        <section className="mt-2 bg-white px-4 py-5">
          <h2 className="text-[16px] font-bold">수업 시간표</h2>
          <a href={gym.timetableUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gym.timetableUrl} alt={`${gym.name} 수업 시간표`} className="w-full rounded-xl border border-line" />
          </a>
          <p className="mt-2 text-[12px] text-muted">눌러서 크게 보기</p>
        </section>
      )}

      <section className="mt-2 bg-white px-4 py-5">
        <h2 className="text-[16px] font-bold">가격</h2>
        <div className="mt-3 divide-y divide-line rounded-xl border border-line text-[14px]">
          <PriceRow label="체험 1회" value={formatWon(gym.trialPrice)} strong />
          <PriceRow label="1일권 (오픈매트·자유운동)" value={dayPass ? formatWon(gym.dayPassPrice!) : "운영 안 함"} />
          <PriceRow label="정기권 (월)" value={gym.monthlyPrice ? formatWon(gym.monthlyPrice) : "체육관 문의"} />
        </div>
        <p className="mt-2 text-[12px] text-muted">정기권 등록은 체험 후 체육관에서 직접 진행돼요.</p>
      </section>

      <section className="mt-2 bg-white px-4 py-5">
        <h2 className="text-[16px] font-bold">시설·제공</h2>
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[14px]">
          {AMENITIES.map((key) => {
            const has = gym.amenities.includes(key);
            return (
              <li key={key} className={`flex items-center gap-2 ${has ? "" : "text-muted/70 line-through"}`}>
                {has ? (
                  <Check size={16} strokeWidth={2.5} className="shrink-0 text-brand" />
                ) : (
                  <X size={16} className="shrink-0" />
                )}
                {key}
              </li>
            );
          })}
        </ul>
      </section>

      {events.length > 0 && (
        <div className="mt-2">
          <EventBand events={events} gyms={[gym]} title="이 체육관 일정" limit={5} showGym={false} />
        </div>
      )}

      <ReviewSection gymId={gym.id} />

      {/* 하단 고정 예약 버튼 (앱 폭 안, 홈 바 영역 여백) */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className={`grid gap-2 text-[15px] font-bold ${dayPass ? "grid-cols-[1fr_1.4fr]" : "grid-cols-1"}`}>
          {dayPass && (
            <Link
              href={`/gym/${gym.id}/apply?type=daypass`}
              className="rounded-xl border border-ink py-3.5 text-center active:bg-field"
            >
              1일권 {formatWon(gym.dayPassPrice!)}
            </Link>
          )}
          <Link
            href={`/gym/${gym.id}/apply`}
            className="rounded-xl bg-brand py-3.5 text-center text-white active:opacity-90"
          >
            체험 신청 · {formatWon(gym.trialPrice)}
          </Link>
        </div>
      </div>
    </main>
  );
}

function PriceRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-muted">{label}</span>
      <b className={`tabular-nums ${strong ? "text-brand" : ""}`}>{value}</b>
    </div>
  );
}

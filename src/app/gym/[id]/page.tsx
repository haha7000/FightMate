import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AMENITIES, MOCK_GYMS, formatPrice, isHandsFree } from "@/lib/gyms";
import { getEventsByGym, getGymById } from "@/lib/data.server";
import ReviewSection from "@/components/ReviewSection";
import EventCard from "@/components/EventCard";

interface Props {
  params: Promise<{ id: string }>;
}

// 빌드 시점 정적 경로는 목데이터 기준. DB에만 있는 체육관은 요청 시 렌더(dynamicParams 기본 true).
export function generateStaticParams() {
  return MOCK_GYMS.map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const gym = await getGymById(id);
  if (!gym) return {};
  return {
    title: `${gym.name} — FightMate`,
    description: `${gym.district} · ${gym.disciplines.join("/")} · 체험 ${formatPrice(gym.trialPrice)}`,
    openGraph: {
      title: `${gym.name} — 체험 ${formatPrice(gym.trialPrice)}`,
      description: gym.intro,
    },
  };
}

export default async function GymDetailPage({ params }: Props) {
  const { id } = await params;
  const gym = await getGymById(id);
  if (!gym) notFound();
  const events = await getEventsByGym(id);

  return (
    <main className="mx-auto max-w-2xl pb-28 md:pb-16">
      <header className="px-5 pt-6 md:pt-10">
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          ← 목록으로
        </Link>
        {gym.photos.length > 0 ? (
          // TODO(M2): Supabase Storage 사진으로 교체 (현재는 데모 플레이스홀더)
          <div className="-mx-5 mt-5">
            <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-1">
              {gym.photos.map((photo) => (
                <figure key={photo.src + photo.caption} className="shrink-0 snap-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={`${gym.name} ${photo.caption}`}
                    className="h-44 w-72 rounded-xl object-cover md:h-56 md:w-[22rem]"
                  />
                  <figcaption className="mt-1.5 text-center text-xs text-neutral-400">
                    {photo.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 flex h-40 items-center justify-center rounded-2xl bg-white text-6xl md:h-56 md:text-7xl">
            {gym.emoji}
          </div>
        )}
        <h1 className="display mt-6 text-3xl md:text-4xl">{gym.name}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {gym.district} · ⭐ {gym.rating} · 리뷰 {gym.reviewCount}개
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {gym.disciplines.map((d) => (
            <span
              key={d}
              className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
            >
              {d}
            </span>
          ))}
        </div>
      </header>

      <section className="mt-6 px-5">
        <h2 className="text-sm font-semibold text-neutral-600">소개</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          {gym.intro}
        </p>
        <p className="mt-3 text-xs text-neutral-400">{gym.address}</p>
      </section>

      <section className="mt-6 px-5">
        <h2 className="text-sm font-semibold text-neutral-600">시설 · 제공 사항</h2>
        {isHandsFree(gym) && (
          <p className="mt-2 inline-block rounded-lg bg-orange-100 px-2.5 py-1.5 text-xs font-semibold text-orange-700">
            🙌 몸만 가도 OK — 운동복·수건 제공
          </p>
        )}
        <ul className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
          {AMENITIES.map(({ key, emoji }) => {
            const has = gym.amenities.includes(key);
            return (
              <li
                key={key}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                  has
                    ? "border-neutral-200 bg-white text-neutral-800"
                    : "border-neutral-200 bg-neutral-50 text-neutral-400 line-through"
                }`}
              >
                <span className={has ? "" : "grayscale opacity-40"}>{emoji}</span>
                {key}
              </li>
            );
          })}
        </ul>
        {!isHandsFree(gym) && (
          <p className="mt-2 text-xs text-neutral-400">
            {gym.amenities.includes("운동복 대여")
              ? "수건은 직접 챙겨가세요."
              : gym.amenities.includes("수건 제공")
                ? "운동복은 직접 챙겨가세요."
                : "운동복과 수건은 직접 챙겨가세요."}
          </p>
        )}
      </section>

      <section className="mt-6 px-5">
        <h2 className="text-sm font-semibold text-neutral-600">가격</h2>
        <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200">
          <PriceRow label="체험 1회" value={formatPrice(gym.trialPrice)} highlight />
          <PriceRow label="1일권 (오픈매트·자유운동)" value={formatPrice(gym.dayPassPrice)} />
          {gym.monthlyPrice && (
            <PriceRow label="정기권 (월)" value={formatPrice(gym.monthlyPrice)} />
          )}
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          정기권 등록은 체험 후 체육관에서 직접 진행돼요.
        </p>
      </section>

      {events.length > 0 && (
        <section className="mt-6 px-5">
          <h2 className="text-sm font-semibold text-neutral-600">
            다가오는 이벤트
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {events.map((ev) => (
              <li key={ev.id}>
                <EventCard event={ev} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <ReviewSection gymId={gym.id} />

      {/* 모바일: 하단 고정 CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-neutral-50/95 p-4 backdrop-blur md:hidden">
        <Link
          href={`/gym/${gym.id}/apply`}
          className="mx-auto block w-full max-w-2xl rounded-xl bg-orange-500 py-3.5 text-center font-bold text-white active:bg-orange-600"
        >
          체험 신청하기 · {formatPrice(gym.trialPrice)}
        </Link>
      </div>

      {/* 데스크톱: 본문 내 CTA */}
      <div className="hidden px-5 pt-8 md:block">
        <Link
          href={`/gym/${gym.id}/apply`}
          className="block w-full rounded-xl bg-orange-500 py-3.5 text-center font-bold text-white hover:bg-orange-600"
        >
          체험 신청하기 · {formatPrice(gym.trialPrice)}
        </Link>
      </div>
    </main>
  );
}

function PriceRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 last:border-b-0">
      <span className="text-sm text-neutral-600">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-orange-600" : ""}`}>
        {value}
      </span>
    </div>
  );
}

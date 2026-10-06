import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FighterCardView } from "@/components/FighterCardView";
import { Wordmark } from "@/components/nav";
import { getFighterProfile } from "@/lib/data.server";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getFighterProfile(id);
  return {
    title: profile ? `${profile.nickname} — 파이터 카드 | FightMate` : "파이터 카드 | FightMate",
    robots: { index: false }, // 개인 프로필은 검색에 올리지 않는다 (QR·링크로만)
  };
}

// 파이터 카드 QR로 들어오는 공개 프로필
export default async function FighterPage({ params }: Props) {
  const { id } = await params;
  const profile = await getFighterProfile(id);
  if (!profile) notFound();

  return (
    <main className="min-h-dvh px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="flex items-center justify-between">
        <Wordmark />
      </header>
      <div className="mt-5">
        <FighterCardView profile={profile} />
      </div>
      <section className="mt-8 rounded-xl bg-white p-5 text-center">
        <p className="text-[16px] font-bold">나도 같이 운동해볼까?</p>
        <p className="mt-1 text-[13px] text-muted">내 근처 격투기 체육관을 찾고 전화 없이 체험을 예약하세요.</p>
        <Link href="/" className="mt-4 block rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white">
          체육관 둘러보기
        </Link>
        <Link href="/card" className="mt-2 block rounded-xl bg-field py-3.5 text-[15px] font-bold">
          내 파이터 카드 만들기
        </Link>
      </section>
    </main>
  );
}

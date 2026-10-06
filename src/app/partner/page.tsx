import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Lock } from "lucide-react";
import PartnerConsole from "@/components/partner/PartnerConsole";
import { getGyms } from "@/lib/data.server";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "관장 모드 — FightMate", robots: { index: false } };

interface Props {
  searchParams: Promise<{ gym?: string }>;
}

// 관장 모드: 연결된 체육관의 신청·일정·정보·홍보 관리. 운영자는 모든 체육관에 들어올 수 있다.
export default async function PartnerPage({ searchParams }: Props) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent("/partner")}`);

  const gyms = viewer.isAdmin ? await getGyms({ includeHidden: true }) : viewer.memberships.map((m) => m.gym);

  if (gyms.length === 0) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-field">
          <Lock size={26} className="text-muted" />
        </span>
        <h1 className="mt-5 text-[20px] font-bold">관장님 전용 화면이에요</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          FightMate에서 받은 초대 링크로 로그인하면
          <br />
          체육관이 연결되고 이 화면을 쓸 수 있어요.
        </p>
        <Link href="/for-gyms" className="mt-8 rounded-xl bg-brand px-6 py-3 text-[15px] font-bold text-white">
          우리 체육관 입점 신청하기
        </Link>
        <Link href="/" className="mt-2 rounded-xl bg-field px-6 py-3 text-[15px] font-bold">
          홈으로
        </Link>
      </main>
    );
  }

  const { gym: requested } = await searchParams;
  const current = gyms.find((g) => g.id === requested) ?? gyms[0];

  return (
    <PartnerConsole
      gym={current}
      gyms={gyms.map((g) => ({ id: g.id, name: g.name }))}
      isAdmin={viewer.isAdmin}
    />
  );
}

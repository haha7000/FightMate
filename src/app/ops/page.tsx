import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import OpsConsole from "@/components/ops/OpsConsole";
import { getGyms } from "@/lib/data.server";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "운영자 — FightMate", robots: { index: false } };

// 운영자 화면: 체육관 등록 · 관장 초대 링크 · 입점 요청
export default async function OpsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent("/ops")}`);

  if (!viewer.isAdmin) {
    // 첫 운영자 지정을 돕기 위해 내 회원 ID와 실행할 SQL을 보여준다 (SQL Editor에서만 실행 가능)
    return (
      <main className="flex min-h-dvh flex-col justify-center px-6">
        <ShieldAlert size={32} className="text-muted" />
        <h1 className="mt-4 text-[20px] font-bold">운영자 전용 화면이에요</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          운영자로 등록하려면 Supabase SQL Editor에서 아래 문장을 실행하세요.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-ink p-3 text-[12px] leading-relaxed text-white">
          {`insert into admins (user_id)\nvalues ('${viewer.userId}')\non conflict do nothing;`}
        </pre>
        <p className="mt-3 text-[12px] text-muted">내 회원 ID: {viewer.userId}</p>
      </main>
    );
  }

  const gyms = await getGyms();
  return <OpsConsole gyms={gyms} />;
}

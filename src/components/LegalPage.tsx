import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LEGAL, LEGAL_DRAFT } from "@/lib/legal";

// 약관·방침 공통 레이아웃: 읽기 쉬운 본문 폭, 조항 제목, 시행일
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-white pb-[calc(env(safe-area-inset-bottom)+3rem)]">
      <header className="sticky top-0 flex items-center gap-1 border-b border-line bg-white/95 px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 backdrop-blur">
        <Link href="/" aria-label="홈으로" className="flex h-10 w-10 items-center justify-center">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-[17px] font-bold">{title}</h1>
      </header>
      {LEGAL_DRAFT && (
        <p className="mx-4 mt-4 rounded-lg bg-field px-3 py-2 text-[12px] text-muted">
          시행 전 초안입니다. 정식 출시 전에 내용이 바뀔 수 있어요.
        </p>
      )}
      <article className="px-5 pt-5 text-[14px] leading-relaxed text-ink/85 [&_h2]:mt-7 [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:text-ink [&_li]:mt-1 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
        <p className="mt-8 text-[13px] text-muted">시행일: {LEGAL.effectiveDate}</p>
      </article>
    </main>
  );
}

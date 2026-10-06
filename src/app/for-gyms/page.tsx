import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, MessageSquareOff, Smartphone } from "lucide-react";
import PartnerApplyForm from "@/components/PartnerApplyForm";

export const metadata: Metadata = {
  title: "체육관 관장님 입점 신청 — FightMate",
  description: "체험 문의를 전화 대신 링크로 받으세요. FightMate에 체육관을 올리고 새 수련생을 만나보세요.",
};

const BENEFITS = [
  { icon: MessageSquareOff, title: "전화 대신 링크로 체험 신청", body: "손님이 날짜·시간대를 골라 신청해요. 수업 중에 전화 받을 필요가 없어요." },
  { icon: Smartphone, title: "폰에서 바로 확인·확정", body: "들어온 신청을 관장 모드에서 확정하고, 방문하면 완료 처리해요." },
  { icon: CalendarDays, title: "오픈매트·세미나 홍보", body: "일정을 올리면 다른 체육관 수련생에게도 보여요." },
];

const STEPS = ["아래 양식으로 신청", "운영팀이 전화로 확인", "체육관 페이지 등록 + 관장 모드 초대 링크(카톡)", "카카오 로그인 한 번이면 바로 사용"];

// 관장님용 안내 + 입점 신청. 관장 권한은 여기서 생기지 않고, 확인 후 운영자 초대 링크로만 연결된다.
export default function ForGymsPage() {
  return (
    <main className="min-h-dvh pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="flex items-center gap-1 bg-white px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2">
        <Link href="/" aria-label="홈으로" className="flex h-10 w-10 items-center justify-center">
          <ChevronLeft size={24} />
        </Link>
        <span className="text-[17px] font-bold">관장님 입점 신청</span>
      </header>

      <section className="bg-white px-5 pt-4 pb-6">
        <p className="text-[12px] font-bold text-brand">체육관 관장님께</p>
        <h1 className="mt-1 text-[24px] font-bold leading-snug">
          체험 문의,
          <br />
          이제 링크 하나로 받으세요
        </h1>
        <ul className="mt-5 flex flex-col gap-4">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-tint">
                <Icon size={19} className="text-brand" />
              </span>
              <span>
                <b className="block text-[15px]">{title}</b>
                <span className="text-[13px] leading-relaxed text-muted">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-[15px] font-bold">입점 절차</h2>
        <ol className="mt-2 flex flex-col gap-1.5 text-[14px]">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      <section className="px-4 pt-6">
        <PartnerApplyForm />
      </section>
    </main>
  );
}

import type { Metadata, Viewport } from "next";
import { Anton, Black_Han_Sans } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/origin";
import { SiteAnalytics } from "@/components/SiteAnalytics";

// 제목용 굵은 한글(Black Han Sans) + 날짜·숫자용 압축체(Anton). 본문은 Pretendard.
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const blackHanSans = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  preload: false, // 한글은 필요한 조각만 받아옴
  variable: "--font-bhs",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()), // 공유 미리보기(OG)·사이트맵의 절대 주소 기준
  appleWebApp: { capable: true, title: "FightMate", statusBarStyle: "default" },
  title: "FightMate — 내 근처 격투기 체육관, 전화 없이 체험 예약",
  description:
    "주짓수·복싱·MMA·무에타이 체육관을 찾고, 전화 없이 체험과 1일권을 예약하세요. 이번 주 오픈매트 일정까지.",
  openGraph: {
    title: "FightMate — 격투기 체험, 링크 하나로",
    description: "내 근처 격투기 체육관을 찾고 전화 없이 체험·1일권을 예약하세요.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // 노치·홈 바 영역까지 쓰고 safe-area로 직접 여백 처리
  themeColor: "#f7f5f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full antialiased ${anton.variable} ${blackHanSans.variable}`}>
      <body className="min-h-full bg-[#e9e5df] text-ink">
        {/* 모바일 우선: PC에서도 폰 폭 한 줄로 보여준다 (앱으로 감쌀 때 그대로 재사용) */}
        <div className="mx-auto min-h-dvh max-w-[480px] bg-paper shadow-[0_0_0_1px_var(--color-line)]">
          {children}
        </div>
        <SiteAnalytics />
      </body>
    </html>
  );
}

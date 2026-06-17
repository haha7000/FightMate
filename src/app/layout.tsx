import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FightMate — 내 근처 격투기 체육관, 전화 없이 체험 예약",
  description:
    "주짓수·복싱·MMA·무에타이 체육관을 찾고, 전화 없이 체험과 1일권을 예약하세요.",
  openGraph: {
    title: "FightMate — 격투기 체험, 링크 하나로",
    description: "내 근처 격투기 체육관을 찾고 전화 없이 체험을 예약하세요.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-neutral-950 text-neutral-100">{children}</body>
    </html>
  );
}

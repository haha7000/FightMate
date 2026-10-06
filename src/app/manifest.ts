import type { MetadataRoute } from "next";

// 홈 화면에 추가하면 앱처럼 열리게 (주소창 없이)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FightMate — 격투기 체육관 체험 예약",
    short_name: "FightMate",
    description: "내 근처 격투기 체육관을 찾고 전화 없이 체험·1일권을 예약하세요.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f2",
    theme_color: "#0e7a55",
    lang: "ko",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

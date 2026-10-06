import type { MetadataRoute } from "next";
import { getGyms, getUpcomingEvents } from "@/lib/data.server";
import { siteUrl } from "@/lib/origin";

// 검색 노출용: 홈·지도·이벤트 + 공개 체육관 상세 + 다가오는 이벤트 + 약관
// 체육관·일정이 바뀌므로 1시간마다 다시 만든다.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [gyms, events] = await Promise.all([
    getGyms().catch(() => []), // DB 장애로 사이트맵 전체가 깨지지 않게
    getUpcomingEvents().catch(() => []),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/map`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/events`, changeFrequency: "daily", priority: 0.7 },
    ...gyms.map((g) => ({ url: `${base}/gym/${g.id}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...events.map((e) => ({ url: `${base}/event/${e.id}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];
}

"use client";

import { Analytics } from "@vercel/analytics/next";
import { scrubAnalyticsUrl } from "@/lib/analytics";

// Vercel Analytics (방문자·페이지 조회). Vercel 대시보드에서 Analytics를 켜야 집계된다.
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = scrubAnalyticsUrl(event.url);
        return url ? { ...event, url } : null;
      }}
    />
  );
}

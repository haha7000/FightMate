import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/origin";

// 관장·운영자 화면, 초대 링크, API, 개인 화면은 검색에 올리지 않는다
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/partner", "/ops", "/admin", "/invite/", "/api/", "/auth/", "/login", "/bookings", "/fighter/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}

import { NextResponse } from "next/server";
import { DISCIPLINES, type Discipline } from "@/lib/gyms";
import { MAX_RADIUS_M, isInKorea } from "@/lib/places";
import { searchGymPlaces } from "@/lib/places.server";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

// 지도를 움직일 때마다 부르므로 넉넉하게, 그래도 스크립트로 쿼터를 다 쓰지 못하게 IP당 분당 40회
const limit = createRateLimiter({ limit: 40, windowMs: 60_000 });

// 지도 화면용 주변 체육관 검색.
// GET /api/places?lat=37.49&lng=127.02&radius=3000&d=주짓수
export async function GET(request: Request) {
  const rate = limit(clientIp(request));
  if (!rate.ok) {
    return NextResponse.json(
      { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const { searchParams } = new URL(request.url);
  // 값이 없을 때 Number(null) = 0 이 되어 (0, 0)을 검색하지 않도록 빈 값은 NaN으로
  const num = (key: string) => {
    const v = searchParams.get(key);
    return v === null || v.trim() === "" ? NaN : Number(v);
  };
  const lat = num("lat");
  const lng = num("lng");
  const radius = num("radius");
  const d = searchParams.get("d");

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "invalid lat/lng" }, { status: 400 });
  }
  if (!isInKorea(lat, lng)) {
    return NextResponse.json({ error: "국내 지역만 검색할 수 있어요" }, { status: 400 });
  }
  const discipline = d && DISCIPLINES.includes(d as Discipline) ? (d as Discipline) : null;

  try {
    const places = await searchGymPlaces({
      lat,
      lng,
      radius: Number.isFinite(radius) ? radius : 3000,
      discipline,
    });
    return NextResponse.json({ places, maxRadius: MAX_RADIUS_M });
  } catch (e) {
    console.error("[places]", e);
    return NextResponse.json({ error: "주변 체육관을 불러오지 못했어요" }, { status: 502 });
  }
}

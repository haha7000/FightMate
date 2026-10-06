import { NextResponse } from "next/server";
import { DISCIPLINES, type Discipline } from "@/lib/gyms";
import { MAX_RADIUS_M } from "@/lib/places";
import { searchGymPlaces } from "@/lib/places.server";

// 지도 화면용 주변 체육관 검색.
// GET /api/places?lat=37.49&lng=127.02&radius=3000&d=주짓수
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? 3000);
  const d = searchParams.get("d");

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "invalid lat/lng" }, { status: 400 });
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

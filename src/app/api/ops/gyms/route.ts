import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DISCIPLINES, type Discipline } from "@/lib/gyms";

interface Body {
  name?: string;
  address?: string;
  disciplines?: string[];
  trialPrice?: number;
  dayPassPrice?: number | null;
  kakaoPlaceId?: string | null;
}

interface KakaoAddressDoc {
  x: string;
  y: string;
  address: { region_2depth_name: string; region_3depth_name: string } | null;
  road_address: { region_2depth_name: string; region_3depth_name: string } | null;
}

// 주소 → 좌표·동네 (카카오 주소 검색). 못 찾으면 null.
async function geocode(address: string) {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?${new URLSearchParams({ query: address })}`,
    { headers: { Authorization: `KakaoAK ${key}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  const doc = ((await res.json()) as { documents: KakaoAddressDoc[] }).documents[0];
  if (!doc) return null;
  const region = doc.address ?? doc.road_address;
  return {
    lat: Number(doc.y),
    lng: Number(doc.x),
    district: region ? `${region.region_2depth_name} ${region.region_3depth_name}`.trim() : "",
  };
}

// 운영자: 체육관 등록. 권한은 DB 정책(운영자만 insert)이 최종 판단하고, 여기서도 먼저 확인한다.
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase 미설정" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "운영자만 등록할 수 있어요" }, { status: 403 });

  const body: Body = await request.json().catch(() => ({}));
  const name = body.name?.trim();
  const address = body.address?.trim();
  const disciplines = (body.disciplines ?? []).filter((d): d is Discipline =>
    DISCIPLINES.includes(d as Discipline)
  );
  if (!name || !address || disciplines.length === 0) {
    return NextResponse.json({ error: "이름·주소·종목은 필수예요" }, { status: 400 });
  }

  const geo = await geocode(address);
  if (!geo) {
    return NextResponse.json(
      { error: "주소로 위치를 찾지 못했어요. 도로명 주소로 다시 입력해주세요." },
      { status: 422 }
    );
  }

  const id = `g-${Date.now().toString(36)}`;
  const { error } = await supabase.from("gyms").insert({
    id,
    name,
    address,
    district: geo.district,
    lat: geo.lat,
    lng: geo.lng,
    disciplines,
    trial_price: Math.max(0, Math.round(body.trialPrice ?? 0)),
    day_pass_price: body.dayPassPrice == null ? null : Math.max(0, Math.round(body.dayPassPrice)),
    kakao_place_id: body.kakaoPlaceId ?? null,
    intro: "",
    amenities: [],
    photos: [],
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}

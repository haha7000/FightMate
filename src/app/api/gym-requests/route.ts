import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface GymRequestBody {
  placeId?: string;
  name?: string;
  address?: string;
  phone?: string;
}

// 미입점 체육관 "입점 요청". 어느 체육관을 사람들이 찾는지 = 영업 리드 목록.
// 저장 실패(테이블 미생성·DB 중단 등)여도 유저 흐름은 막지 않는다.
export async function POST(request: Request) {
  let body: GymRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { placeId, name, address, phone } = body;
  if (!placeId || !name) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const { error } = await supabase.from("gym_requests").insert({
      kakao_place_id: placeId,
      name,
      address: address ?? "",
      phone: phone ?? "",
      user_id: user?.id ?? null,
    });
    if (!error) return NextResponse.json({ ok: true, persisted: true });
    console.error("[gym-request]", error.message);
  }

  console.log("[gym-request:not-persisted]", { placeId, name });
  return NextResponse.json({ ok: true, persisted: false });
}

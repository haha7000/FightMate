import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGymById } from "@/lib/data.server";

interface InquiryBody {
  gymId?: string;
  name?: string;
  phone?: string;
  date?: string;
  type?: string;
}

// 체험·1일권 신청 접수.
// Supabase 설정 시 bookings 테이블에 저장, 아니면 로그만 남김(데모).
// TODO(M2): 관장에게 알림(알림톡/문자) 발송
export async function POST(request: Request) {
  let body: InquiryBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { gymId, name, phone, date } = body;
  const type = body.type === "1일권" ? "1일권" : "체험";
  if (!gymId || !name?.trim() || !phone?.trim() || !date) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const supabase = await createClient();
  if (supabase) {
    const gym = await getGymById(gymId);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("bookings").insert({
      user_id: user?.id ?? null,
      gym_id: gymId,
      gym_name: gym?.name ?? gymId,
      name: name.trim(),
      phone: phone.trim(),
      date,
      type,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, persisted: true });
  }

  console.log("[inquiry:demo]", { gymId, name, phone, date });
  return NextResponse.json({ ok: true, persisted: false });
}

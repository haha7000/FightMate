import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGymById } from "@/lib/data.server";
import { newBookingText, sendSms } from "@/lib/notify.server";
import { publicOrigin } from "@/lib/origin";

interface InquiryBody {
  gymId?: string;
  name?: string;
  phone?: string;
  date?: string;
  type?: string;
}

interface NotifyTarget {
  phone: string;
  gym_id: string;
  gym_name: string;
  applicant: string;
  visit_date: string;
  kind: string;
}

// 체험·1일권 신청 접수 → 관장님께 문자 알림 (응답을 먼저 보내고 문자는 그 뒤에)
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
  if (!supabase) {
    console.log("[inquiry:demo]", { gymId, name, phone, date, type });
    return NextResponse.json({ ok: true, persisted: false });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  }

  const gym = await getGymById(gymId);
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      gym_id: gymId,
      gym_name: gym?.name ?? gymId,
      name: name.trim(),
      phone: phone.trim(),
      date,
      type,
    })
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 알림 받을 번호는 손님 세션으로만 조회 가능 (방금 낸 본인 신청 한정) — 응답 전에 조회해 둔다
  const { data: targets } = await supabase.rpc("booking_notify_targets", { bid: booking.id });
  const origin = publicOrigin(request);
  const opsPhone = process.env.OPS_NOTIFY_PHONE; // 초기 운영: 사장님도 모든 신청을 문자로 받기

  after(async () => {
    const list = (targets ?? []) as NotifyTarget[];
    for (const t of list) {
      await sendSms(
        t.phone,
        newBookingText({
          gymName: t.gym_name,
          applicant: t.applicant,
          date: t.visit_date,
          kind: t.kind,
          link: `${origin}/partner?gym=${t.gym_id}`,
        })
      );
    }
    if (opsPhone) {
      await sendSms(
        opsPhone,
        `[FightMate 운영] ${gym?.name ?? gymId} ${type} 신청 · ${name.trim()} ${date}` +
          (list.length === 0 ? "\n(관장 알림 번호 미등록 — 직접 연락 필요)" : "")
      );
    }
  });

  return NextResponse.json({ ok: true, persisted: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSms, smsConfigured } from "@/lib/notify.server";

// 관장 모드 "테스트 문자 보내기": 등록한 알림 번호로 실제 문자가 오는지 확인
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase 미설정" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  const { gymId } = (await request.json().catch(() => ({}))) as { gymId?: string };
  if (!gymId) return NextResponse.json({ error: "gymId 필요" }, { status: 400 });

  // RLS상 그 체육관 관장·운영자만 번호를 읽을 수 있다 → 못 읽으면 권한 없음
  const { data } = await supabase.from("gym_notify").select("phone").eq("gym_id", gymId).maybeSingle();
  if (!data) return NextResponse.json({ error: "알림 번호를 먼저 등록해주세요" }, { status: 404 });

  if (!smsConfigured) {
    return NextResponse.json({ error: "아직 문자 발송 설정 전이에요 (운영자 설정 필요)" }, { status: 503 });
  }
  const res = await sendSms(data.phone, "[FightMate] 알림 테스트입니다. 새 신청이 오면 이 번호로 바로 알려드릴게요.");
  if (!res.ok) return NextResponse.json({ error: `발송 실패: ${res.error}` }, { status: 502 });
  return NextResponse.json({ ok: true });
}

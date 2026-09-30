import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Ctx {
  params: Promise<{ id: string }>;
}

interface RsvpBody {
  name?: string;
  phone?: string;
}

// 이벤트 참가 신청. 로그인 필수, 정원 마감 시 거절.
// 표시 인원 = events.attendees(베이스라인) + events.rsvp_count(트리거 집계).
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: true, persisted: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  }

  const body: RsvpBody = await req.json().catch(() => ({}));
  const name = body.name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";

  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("attendees, rsvp_count, capacity")
    .eq("id", id)
    .maybeSingle();
  if (eventErr || !event) {
    return NextResponse.json({ error: "이벤트를 찾을 수 없어요" }, { status: 404 });
  }

  // 이미 신청한 경우 멱등 처리
  const { data: existing } = await supabase
    .from("event_rsvps")
    .select("id")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: true, already: true });

  // 정원 체크 (capacity null = 무제한)
  if (event.capacity != null) {
    const total = (event.attendees ?? 0) + (event.rsvp_count ?? 0);
    if (total >= event.capacity) {
      return NextResponse.json({ error: "정원이 마감됐어요" }, { status: 409 });
    }
  }

  const { error } = await supabase
    .from("event_rsvps")
    .insert({ event_id: id, user_id: user.id, name, phone });
  if (error) {
    // 동시 신청으로 unique 충돌 → 이미 신청된 것으로 간주
    if (error.code === "23505") return NextResponse.json({ ok: true, already: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// 신청 취소
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: true, persisted: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  }

  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", id)
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

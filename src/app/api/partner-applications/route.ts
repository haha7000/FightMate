import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validatePartnerApply } from "@/lib/partner-apply";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

// 관장님 입점 신청. 로그인 없이 보낼 수 있으니 IP당 시간당 5건으로 제한 (장난·스팸 방지).
const limit = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

export async function POST(request: Request) {
  const rate = limit(clientIp(request));
  if (!rate.ok) {
    return NextResponse.json(
      { error: "신청이 너무 많아요. 잠시 후 다시 시도해주세요." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요" }, { status: 400 });
  }
  if (body.agreed !== true) {
    return NextResponse.json({ error: "연락을 위한 개인정보 수집에 동의해주세요" }, { status: 400 });
  }
  const parsed = validatePartnerApply(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const v = parsed.value;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: true, persisted: false }); // 데모 모드

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  const { error } = await supabase.from("partner_applications").insert({
    gym_name: v.gymName,
    address: v.address,
    owner_name: v.ownerName,
    phone: v.phone,
    message: v.message,
    user_id: user?.id ?? null,
  });
  if (error) {
    console.error("[partner-apply]", error.message);
    return NextResponse.json({ error: "신청을 저장하지 못했어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, persisted: true });
}

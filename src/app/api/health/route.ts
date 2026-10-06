import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 상태 확인: 사이트와 DB가 살아 있는지. GitHub Actions가 매일 불러서
// ① Supabase 무료 플랜이 7일 무접속으로 일시정지되는 걸 막고 ② 죽어 있으면 실패 메일로 알려준다.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: true, db: "demo" });

  const { error } = await supabase.from("gyms").select("id").limit(1);
  if (error) {
    console.error("[health]", error.message);
    return NextResponse.json({ ok: false, db: "error" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, db: "ok" });
}

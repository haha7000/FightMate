import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 회원 탈퇴: DB 함수가 개인정보를 지우고 계정을 삭제한 뒤, 로그인 쿠키를 지운다.
export async function POST() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase 미설정" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("[account:delete]", error.message);
    return NextResponse.json({ error: "탈퇴를 처리하지 못했어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
  await supabase.auth.signOut(); // 계정은 이미 지워졌지만 브라우저 쿠키도 정리
  return NextResponse.json({ ok: true });
}

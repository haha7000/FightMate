import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rowToGym, type Gym } from "@/lib/gyms";
import { displayName } from "@/lib/user";

type GymRole = "owner" | "coach";

export interface Viewer {
  userId: string;
  name: string;
  isAdmin: boolean; // 운영자
  memberships: { gym: Gym; role: GymRole }[]; // 관장·코치로 연결된 체육관
}

// 서버에서 현재 로그인 사용자와 역할을 읽는다. 비로그인이면 null.
// 역할 테이블이 아직 없으면(마이그레이션 전) 조회 실패 → 역할 없음으로 취급한다.
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [adminRes, memberRes] = await Promise.all([
    supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("gym_members").select("role, gyms(*)").eq("user_id", user.id),
  ]);

  const name = displayName(user.user_metadata, "회원");

  // gym_members → gyms 외래키 관계로 체육관 행이 함께 온다 (DB 타입에 관계 정의)
  const memberships = (memberRes.data ?? []).flatMap((r) =>
    r.gyms ? [{ gym: rowToGym(r.gyms), role: (r.role === "coach" ? "coach" : "owner") as GymRole }] : []
  );

  return { userId: user.id, name, isAdmin: !!adminRes.data, memberships };
}

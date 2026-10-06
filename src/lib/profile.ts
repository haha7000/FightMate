import type { Tables } from "@/lib/database.types";
import type { FighterProfile } from "@/lib/store";

// DB profiles 행 → 화면용 파이터 프로필 (빈 값은 기본값으로)
export function rowToProfile(row: Tables<"profiles">): FighterProfile {
  return {
    nickname: row.nickname ?? "",
    discipline: row.discipline ?? "주짓수",
    weightClass: row.weight_class ?? "",
    gymName: row.gym_name ?? "",
    years: row.years ?? "",
    belt: row.belt ?? "해당 없음",
  };
}

// Supabase 회원 ID 형식 (공개 프로필 주소 검증용 — 이상한 값으로 DB를 두드리지 않게)
export function isUserId(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export function fighterPath(userId: string): string {
  return `/fighter/${userId}`;
}

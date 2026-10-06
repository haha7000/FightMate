import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rowToGym, type Gym } from "@/lib/gyms";
import { rowToEvent, todayKST, upcoming, type GymEvent } from "@/lib/events";
import { MOCK_EVENTS, MOCK_GYMS } from "@/lib/mock-data";
import { isUserId, rowToProfile } from "@/lib/profile";
import type { FighterProfile } from "@/lib/store";

// 서버 컴포넌트용 조회 함수.
// - 데모 모드(Supabase 키 없음): 목데이터
// - 실서비스: DB만. 조회 실패는 예외로 올려 error.tsx가 "다시 시도" 화면을 보여준다.
//   (예전엔 실패 시 목데이터로 조용히 대체해, DB 장애 중 가짜 체육관이 예약 가능하게 보였다)

class DataError extends Error {
  constructor(what: string, cause: { message: string }) {
    super(`${what} 조회 실패: ${cause.message}`);
    this.name = "DataError";
  }
}

// 손님 화면은 공개된 체육관만. 운영자 화면은 숨긴 곳까지 (includeHidden).
// (RLS도 숨긴 곳을 손님에게 막지만, 관장·운영자가 홈을 볼 때 섞여 보이지 않게 여기서도 거른다)
export async function getGyms({ includeHidden = false } = {}): Promise<Gym[]> {
  const supabase = await createClient();
  if (!supabase) return MOCK_GYMS;

  let q = supabase.from("gyms").select("*");
  if (!includeHidden) q = q.eq("is_published", true);
  const { data, error } = await q.order("rating", { ascending: false });
  if (error) throw new DataError("체육관 목록", error);
  return data.map(rowToGym);
}

export async function getGymById(id: string): Promise<Gym | undefined> {
  const supabase = await createClient();
  if (!supabase) return MOCK_GYMS.find((g) => g.id === id);

  const { data, error } = await supabase.from("gyms").select("*").eq("id", id).maybeSingle();
  if (error) throw new DataError("체육관", error);
  return data ? rowToGym(data) : undefined;
}

// 다가오는 이벤트 전체 (홈·이벤트 탭)
export async function getUpcomingEvents(): Promise<GymEvent[]> {
  const supabase = await createClient();
  if (!supabase) return upcoming(MOCK_EVENTS);

  // 숨긴 체육관의 일정은 빼고
  const { data, error } = await supabase
    .from("events")
    .select("*, gyms!inner(is_published)")
    .eq("gyms.is_published", true)
    .gte("date", todayKST())
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new DataError("이벤트 목록", error);
  return data.map(rowToEvent);
}

// 특정 체육관의 다가오는 이벤트
export async function getEventsByGym(gymId: string): Promise<GymEvent[]> {
  const supabase = await createClient();
  if (!supabase) return upcoming(MOCK_EVENTS.filter((e) => e.gymId === gymId));

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("gym_id", gymId)
    .gte("date", todayKST())
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new DataError("체육관 이벤트", error);
  return data.map(rowToEvent);
}

export async function getEventById(id: string): Promise<GymEvent | undefined> {
  const supabase = await createClient();
  if (!supabase) return MOCK_EVENTS.find((e) => e.id === id);

  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw new DataError("이벤트", error);
  return data ? rowToEvent(data) : undefined;
}

// 공개 파이터 프로필 (카드 QR로 들어오는 페이지). 닉네임이 없으면 공개할 게 없으니 null.
export async function getFighterProfile(userId: string): Promise<FighterProfile | null> {
  if (!isUserId(userId)) return null;
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new DataError("파이터 프로필", error);
  if (!data?.nickname?.trim()) return null;
  return rowToProfile(data);
}

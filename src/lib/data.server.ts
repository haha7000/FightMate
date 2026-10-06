import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rowToGym, type Gym } from "@/lib/gyms";
import { rowToEvent, todayKST, upcoming, type GymEvent } from "@/lib/events";
import { MOCK_EVENTS, MOCK_GYMS } from "@/lib/mock-data";

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

export async function getGyms(): Promise<Gym[]> {
  const supabase = await createClient();
  if (!supabase) return MOCK_GYMS;

  const { data, error } = await supabase.from("gyms").select("*").order("rating", { ascending: false });
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

  const { data, error } = await supabase
    .from("events")
    .select("*")
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

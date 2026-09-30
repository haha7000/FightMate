import { createClient } from "@/lib/supabase/server";
import { MOCK_GYMS, rowToGym, type Gym } from "@/lib/gyms";
import { MOCK_EVENTS, rowToEvent, upcoming, type GymEvent } from "@/lib/events";

// 체육관 목록 — Supabase 설정 시 DB에서, 아니면 목데이터.
export async function getGyms(): Promise<Gym[]> {
  const supabase = await createClient();
  if (!supabase) return MOCK_GYMS;

  const { data, error } = await supabase
    .from("gyms")
    .select("*")
    .order("rating", { ascending: false });

  if (error || !data?.length) return MOCK_GYMS;
  return data.map(rowToGym);
}

export async function getGymById(id: string): Promise<Gym | undefined> {
  const supabase = await createClient();
  if (!supabase) return MOCK_GYMS.find((g) => g.id === id);

  const { data, error } = await supabase
    .from("gyms")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return MOCK_GYMS.find((g) => g.id === id);
  return rowToGym(data);
}

// 다가오는 이벤트 전체 (홈 피드용)
export async function getUpcomingEvents(): Promise<GymEvent[]> {
  const supabase = await createClient();
  if (!supabase) return upcoming(MOCK_EVENTS);

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("date", today)
    .order("date", { ascending: true });

  if (error || !data) return upcoming(MOCK_EVENTS);
  return data.map(rowToEvent);
}

// 특정 체육관의 다가오는 이벤트
export async function getEventsByGym(gymId: string): Promise<GymEvent[]> {
  const supabase = await createClient();
  if (!supabase) return upcoming(MOCK_EVENTS.filter((e) => e.gymId === gymId));

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("gym_id", gymId)
    .gte("date", today)
    .order("date", { ascending: true });

  if (error || !data) return upcoming(MOCK_EVENTS.filter((e) => e.gymId === gymId));
  return data.map(rowToEvent);
}

export async function getEventById(id: string): Promise<GymEvent | undefined> {
  const supabase = await createClient();
  if (!supabase) return MOCK_EVENTS.find((e) => e.id === id);

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return MOCK_EVENTS.find((e) => e.id === id);
  return rowToEvent(data);
}

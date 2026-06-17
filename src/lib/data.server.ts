import { createClient } from "@/lib/supabase/server";
import { MOCK_GYMS, type Gym } from "@/lib/gyms";
import { MOCK_EVENTS, upcoming, type GymEvent } from "@/lib/events";

// DB row(snake_case) → Gym(camelCase) 매핑
function rowToGym(r: Record<string, unknown>): Gym {
  return {
    id: r.id as string,
    name: r.name as string,
    disciplines: (r.disciplines as Gym["disciplines"]) ?? [],
    district: r.district as string,
    address: r.address as string,
    intro: (r.intro as string) ?? "",
    trialPrice: (r.trial_price as number) ?? 0,
    dayPassPrice: (r.day_pass_price as number) ?? 0,
    monthlyPrice: (r.monthly_price as number) ?? null,
    rating: Number(r.rating ?? 0),
    reviewCount: (r.review_count as number) ?? 0,
    emoji: (r.emoji as string) ?? "🥊",
    amenities: (r.amenities as Gym["amenities"]) ?? [],
    photos: (r.photos as Gym["photos"]) ?? [],
  };
}

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

// DB row → GymEvent 매핑
function rowToEvent(r: Record<string, unknown>): GymEvent {
  return {
    id: r.id as string,
    gymId: r.gym_id as string,
    gymName: r.gym_name as string,
    kind: r.kind as GymEvent["kind"],
    title: r.title as string,
    date: r.date as string,
    startTime: (r.start_time as string) ?? "",
    fee: (r.fee as number) ?? 0,
    capacity: (r.capacity as number) ?? null,
    description: (r.description as string) ?? "",
    openToVisitors: (r.open_to_visitors as boolean) ?? true,
  };
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

import { createClient } from "@/lib/supabase/server";
import { MOCK_GYMS, type Gym } from "@/lib/gyms";

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

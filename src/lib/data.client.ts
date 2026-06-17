"use client";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  addReview as addReviewLocal,
  getBookings as getBookingsLocal,
  getProfile as getProfileLocal,
  getReviews as getReviewsLocal,
  setProfile as setProfileLocal,
  type Booking,
  type FighterProfile,
  type Review,
} from "@/lib/store";

// ── 예약 ──────────────────────────────────────
export async function fetchBookings(): Promise<Booking[]> {
  if (!isSupabaseConfigured) return getBookingsLocal();
  const supabase = createClient();
  if (!supabase) return getBookingsLocal();

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    gymId: r.gym_id,
    gymName: r.gym_name,
    name: r.name,
    phone: r.phone,
    date: r.date,
    type: r.type,
    status: r.status,
    createdAt: r.created_at,
  }));
}

// ── 리뷰 ──────────────────────────────────────
export async function fetchReviews(gymId: string): Promise<Review[]> {
  if (!isSupabaseConfigured) return getReviewsLocal(gymId);
  const supabase = createClient();
  if (!supabase) return getReviewsLocal(gymId);

  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("gym_id", gymId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    gymId: r.gym_id,
    author: r.author,
    rating: r.rating,
    text: r.text,
    date: (r.created_at as string).slice(0, 10),
  }));
}

export async function submitReview(input: {
  gymId: string;
  author: string;
  rating: number;
  text: string;
}): Promise<void> {
  if (!isSupabaseConfigured) {
    addReviewLocal(input);
    return;
  }
  const supabase = createClient();
  if (!supabase) {
    addReviewLocal(input);
    return;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("reviews").insert({
    gym_id: input.gymId,
    user_id: user?.id ?? null,
    author: input.author,
    rating: input.rating,
    text: input.text,
  });
}

// ── 프로필 ────────────────────────────────────
export async function fetchProfile(): Promise<FighterProfile | null> {
  if (!isSupabaseConfigured) return getProfileLocal();
  const supabase = createClient();
  if (!supabase) return getProfileLocal();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;

  return {
    nickname: data.nickname ?? "",
    discipline: data.discipline ?? "주짓수",
    weightClass: data.weight_class ?? "",
    gymName: data.gym_name ?? "",
    years: data.years ?? "",
    belt: data.belt ?? "해당 없음",
  };
}

export async function saveProfile(p: FighterProfile): Promise<void> {
  if (!isSupabaseConfigured) {
    setProfileLocal(p);
    return;
  }
  const supabase = createClient();
  if (!supabase) {
    setProfileLocal(p);
    return;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    setProfileLocal(p);
    return;
  }
  await supabase.from("profiles").upsert({
    id: user.id,
    nickname: p.nickname,
    discipline: p.discipline,
    weight_class: p.weightClass,
    gym_name: p.gymName,
    years: p.years,
    belt: p.belt,
    updated_at: new Date().toISOString(),
  });
}

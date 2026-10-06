"use client";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { MOCK_EVENTS } from "@/lib/mock-data";
import {
  rowToEvent,
  todayKST,
  upcoming,
  type GymEvent,
} from "@/lib/events";
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
import { toBookingStatus, toBookingType } from "@/lib/bookings";

// ── 예약 ──────────────────────────────────────
export async function fetchBookings(): Promise<Booking[]> {
  if (!isSupabaseConfigured) return getBookingsLocal();
  const supabase = createClient();
  if (!supabase) return getBookingsLocal();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // 관장은 RLS상 자기 체육관 신청도 조회되므로 "내 예약"은 본인 것만
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    gymId: r.gym_id,
    gymName: r.gym_name,
    name: r.name,
    phone: r.phone,
    date: r.date,
    type: toBookingType(r.type),
    status: toBookingStatus(r.status),
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
    date: r.created_at.slice(0, 10),
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

// ── 이벤트 RSVP ───────────────────────────────
export interface RsvpEntry {
  name: string;
  phone: string;
  createdAt: string;
}

const rsvpKey = (eventId: string) => `fm_rsvp_${eventId}`;

function readDemoRsvp(eventId: string): RsvpEntry | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(rsvpKey(eventId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RsvpEntry;
  } catch {
    return null;
  }
}

// 현재 유저가 이 이벤트에 신청했는지
export async function fetchRsvped(eventId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return readDemoRsvp(eventId) !== null;

  const supabase = createClient();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("event_rsvps")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}

// 신청(on=true)/취소(on=false). 정원 체크 등 로직은 API Route에서.
export async function setRsvp(
  eventId: string,
  on: boolean,
  info?: { name: string; phone: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    if (typeof window !== "undefined") {
      if (on) {
        window.localStorage.setItem(
          rsvpKey(eventId),
          JSON.stringify({
            name: info?.name ?? "",
            phone: info?.phone ?? "",
            createdAt: new Date().toISOString(),
          })
        );
      } else {
        window.localStorage.removeItem(rsvpKey(eventId));
      }
    }
    return { ok: true };
  }

  const res = await fetch(`/api/events/${eventId}/rsvp`, {
    method: on ? "POST" : "DELETE",
    ...(on
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(info ?? {}),
        }
      : {}),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: (body as { error?: string }).error };
  }
  return { ok: true };
}

// 이벤트 신청자 명단 (본인·관장만 조회 가능 — RLS로 보호)
export async function fetchEventRoster(eventId: string): Promise<RsvpEntry[]> {
  if (!isSupabaseConfigured) {
    const mine = readDemoRsvp(eventId);
    return mine ? [mine] : [];
  }
  const supabase = createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("event_rsvps")
    .select("name, phone, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((r) => ({
    name: r.name ?? "",
    phone: r.phone ?? "",
    createdAt: r.created_at,
  }));
}

// 특정 체육관의 다가오는 이벤트 (관장 모드 일정 탭 — 실제 RSVP 수 포함)
export async function fetchGymEvents(gymId: string): Promise<GymEvent[]> {
  const supabase = isSupabaseConfigured ? createClient() : null;
  if (!supabase) return upcoming(MOCK_EVENTS.filter((e) => e.gymId === gymId));

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("gym_id", gymId)
    .gte("date", todayKST())
    .order("date", { ascending: true });
  if (error) throw new Error(`일정을 불러오지 못했어요: ${error.message}`);
  return data.map(rowToEvent);
}

// 포스터 이미지 업로드 → 공개 URL 반환. (데모는 임시 object URL)
export async function uploadEventPoster(
  file: File
): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured) return { url: URL.createObjectURL(file) };
  const supabase = createClient();
  if (!supabase) return { url: URL.createObjectURL(file) };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("event-posters")
    .upload(path, file, { contentType: file.type });
  if (error) return { error: error.message };

  const { data } = supabase.storage.from("event-posters").getPublicUrl(path);
  return { url: data.publicUrl };
}

// 이벤트 생성 (관장). RLS상 소유 체육관에만 가능. 데모는 로컬 객체만 반환.
export async function createEvent(
  input: Omit<GymEvent, "id" | "attendees">
): Promise<{ event?: GymEvent; error?: string }> {
  const local = (): GymEvent => ({
    ...input,
    id: `ev-local-${Date.now()}`,
    attendees: 0,
  });
  if (!isSupabaseConfigured) return { event: local() };
  const supabase = createClient();
  if (!supabase) return { event: local() };

  const id = `ev-${input.gymId}-${Date.now()}`;
  const { data, error } = await supabase
    .from("events")
    .insert({
      id,
      gym_id: input.gymId,
      gym_name: input.gymName,
      kind: input.kind,
      title: input.title,
      date: input.date,
      start_time: input.startTime,
      fee: input.fee,
      capacity: input.capacity,
      description: input.description,
      poster_url: input.posterUrl ?? null,
      open_to_visitors: input.openToVisitors,
    })
    .select("*")
    .maybeSingle();

  if (error) return { error: error.message };
  return { event: data ? rowToEvent(data) : local() };
}

// 이벤트 삭제 (관장). 데모는 로컬 처리.
export async function deleteEventById(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: true };
  const supabase = createClient();
  if (!supabase) return { ok: true };

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
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

"use client";

// 관장 모드·운영자 화면에서 쓰는 데이터 함수. 권한은 DB 보안 정책(RLS)이 최종 판단한다.
import { createClient } from "@/lib/supabase/client";
import type { Gym } from "@/lib/gyms";
import { digitsOnly } from "@/lib/format";
import { toBookingStatus, toBookingType, type BookingStatus, type BookingType } from "@/lib/bookings";

export type { BookingStatus } from "@/lib/bookings";

export interface GymBooking {
  id: string;
  name: string;
  phone: string;
  date: string;
  type: BookingType;
  status: BookingStatus;
  createdAt: string;
  statusChangedAt: string | null; // 거절·확정한 시각 (2026-10-06 SQL 실행 전이면 null)
}

function db() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase가 설정되지 않았어요");
  return supabase;
}

// ── 관장: 신청 관리 ─────────────────────────────
export async function fetchGymBookings(gymId: string): Promise<GymBooking[]> {
  const { data, error } = await db()
    .from("bookings")
    .select("*") // status_changed_at 컬럼이 아직 없어도 동작하도록 전체 선택
    .eq("gym_id", gymId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    date: r.date,
    type: toBookingType(r.type),
    status: toBookingStatus(r.status),
    createdAt: r.created_at,
    statusChangedAt: r.status_changed_at ?? null,
  }));
}

export async function setBookingStatus(id: string, status: BookingStatus): Promise<void> {
  const { error } = await db().from("bookings").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ── 관장: 새 신청 알림 ─────────────────────────
export interface NotifySetting {
  phone: string;
  enabled: boolean;
}

export async function fetchNotify(gymId: string): Promise<NotifySetting | null> {
  const { data, error } = await db().from("gym_notify").select("phone, enabled").eq("gym_id", gymId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveNotify(gymId: string, setting: NotifySetting): Promise<void> {
  const { error } = await db()
    .from("gym_notify")
    .upsert({ gym_id: gymId, phone: digitsOnly(setting.phone), enabled: setting.enabled, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function sendNotifyTest(gymId: string): Promise<void> {
  const res = await fetch("/api/partner/notify-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gymId }),
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(body.error ?? "테스트 문자를 보내지 못했어요");
}

// ── 관장: 체육관 정보 ───────────────────────────
export async function saveGym(gym: Gym): Promise<void> {
  const { error } = await db()
    .from("gyms")
    .update({
      name: gym.name,
      intro: gym.intro,
      disciplines: gym.disciplines,
      trial_price: gym.trialPrice,
      day_pass_price: gym.dayPassPrice,
      monthly_price: gym.monthlyPrice,
      amenities: gym.amenities,
      photos: gym.photos,
    })
    .eq("id", gym.id);
  if (error) throw new Error(error.message);
}

// 사진 업로드: 긴 변 1600px로 줄여 JPEG로 저장 (폰 사진 수 MB → 수백 KB)
export async function uploadGymPhoto(gymId: string, file: File): Promise<string> {
  const blob = await shrinkImage(file, 1600, 0.85);
  const path = `${gymId}/${Date.now()}.jpg`;
  const supabase = db();
  const { error } = await supabase.storage
    .from("gym-photos")
    .upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw new Error(error.message);
  return supabase.storage.from("gym-photos").getPublicUrl(path).data.publicUrl;
}

async function shrinkImage(file: File, maxSide: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("이미지 변환 실패"))), "image/jpeg", quality)
  );
}

// ── 운영자 ─────────────────────────────────────
export interface GymRequestSummary {
  placeId: string;
  name: string;
  address: string;
  phone: string;
  count: number; // 같은 체육관 요청 수 = 수요
  lastAt: string;
}

export async function fetchGymRequests(): Promise<GymRequestSummary[]> {
  const { data, error } = await db()
    .from("gym_requests")
    .select("kakao_place_id, name, address, phone, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const byPlace = new Map<string, GymRequestSummary>();
  for (const r of data ?? []) {
    const cur = byPlace.get(r.kakao_place_id);
    if (cur) cur.count += 1;
    else
      byPlace.set(r.kakao_place_id, {
        placeId: r.kakao_place_id,
        name: r.name,
        address: r.address,
        phone: r.phone,
        count: 1,
        lastAt: r.created_at,
      });
  }
  return [...byPlace.values()].sort((a, b) => b.count - a.count);
}

export async function fetchMemberCounts(): Promise<Record<string, number>> {
  const { data, error } = await db().from("gym_members").select("gym_id");
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const r of data ?? []) counts[r.gym_id] = (counts[r.gym_id] ?? 0) + 1;
  return counts;
}

export async function createInvite(gymId: string, role: "owner" | "coach"): Promise<string> {
  const supabase = db();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("gym_invites")
    .insert({ gym_id: gymId, role, created_by: user?.id ?? null })
    .select("token")
    .single();
  if (error) throw new Error(error.message);
  return data.token;
}

export async function redeemInvite(token: string): Promise<string> {
  const { data, error } = await db().rpc("redeem_gym_invite", { invite_token: token });
  if (error) {
    const known: Record<string, string> = {
      login_required: "로그인이 필요해요",
      invalid_invite: "유효하지 않은 초대 링크예요",
      invite_used: "이미 사용된 초대 링크예요",
      invite_expired: "기간이 지난 초대 링크예요",
    };
    const key = Object.keys(known).find((k) => error.message.includes(k));
    throw new Error(key ? known[key] : error.message);
  }
  return data;
}

// 내 역할 (내 카드 탭에서 관장 모드·운영자 입구 표시용)
export async function fetchMyRoles(): Promise<{ isAdmin: boolean; gymCount: number }> {
  const supabase = createClient();
  if (!supabase) return { isAdmin: false, gymCount: 0 };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, gymCount: 0 };
  const [a, m] = await Promise.all([
    supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("gym_members").select("gym_id").eq("user_id", user.id),
  ]);
  return { isAdmin: !!a.data, gymCount: m.data?.length ?? 0 };
}


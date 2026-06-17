"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AMENITIES, MOCK_GYMS, type Amenity, type Gym } from "@/lib/gyms";
import { type Booking } from "@/lib/store";
import { fetchBookings } from "@/lib/data.client";

// 데모: 첫 번째 체육관의 관장이라고 가정.
// TODO(M1→M2): 로그인한 관장의 체육관을 Supabase에서 로드/저장
export default function AdminPage() {
  const [gym, setGym] = useState<Gym>(MOCK_GYMS[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"info" | "bookings">("bookings");

  useEffect(() => {
    fetchBookings().then((all) =>
      setBookings(all.filter((b) => b.gymId === gym.id))
    );
  }, [gym.id]);

  function update(patch: Partial<Gym>) {
    setGym((g) => ({ ...g, ...patch }));
    setSaved(false);
  }

  function toggleAmenity(a: Amenity) {
    update({
      amenities: gym.amenities.includes(a)
        ? gym.amenities.filter((x) => x !== a)
        : [...gym.amenities, a],
    });
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-8 md:pt-12">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← FightMate
      </Link>
      <h1 className="mt-4 text-xl font-bold md:text-2xl">관장님 페이지</h1>
      <p className="mt-1 text-sm text-neutral-400">{gym.name}</p>

      <div className="mt-6 flex gap-2">
        <TabButton active={tab === "bookings"} onClick={() => setTab("bookings")}>
          신청 목록 {bookings.length > 0 && `(${bookings.length})`}
        </TabButton>
        <TabButton active={tab === "info"} onClick={() => setTab("info")}>
          체육관 정보
        </TabButton>
      </div>

      {tab === "bookings" ? (
        <section className="mt-5">
          {bookings.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-sm text-neutral-500">
              아직 들어온 신청이 없어요.
              <br />
              <span className="text-xs">
                (데모: 첫 화면에서 {gym.name} 체험을 신청하면 여기에 보입니다)
              </span>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {bookings.map((b) => (
                <li
                  key={b.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{b.name}</p>
                    <span className="rounded-md bg-red-950 px-2 py-1 text-[11px] font-semibold text-red-300">
                      {b.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    {b.type} 희망일 {b.date} · {b.phone}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`tel:${b.phone}`}
                      className="flex-1 rounded-lg bg-neutral-800 py-2 text-center text-sm font-medium"
                    >
                      전화하기
                    </a>
                    <a
                      href={`sms:${b.phone}`}
                      className="flex-1 rounded-lg bg-neutral-800 py-2 text-center text-sm font-medium"
                    >
                      문자하기
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="mt-5 flex flex-col gap-4">
          <Field label="체육관 이름">
            <input
              className="input"
              value={gym.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </Field>
          <Field label="소개">
            <textarea
              className="input min-h-20 resize-none"
              value={gym.intro}
              onChange={(e) => update({ intro: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="체험 가격 (원)">
              <input
                className="input"
                type="number"
                value={gym.trialPrice}
                onChange={(e) => update({ trialPrice: Number(e.target.value) })}
              />
            </Field>
            <Field label="1일권 가격 (원)">
              <input
                className="input"
                type="number"
                value={gym.dayPassPrice}
                onChange={(e) => update({ dayPassPrice: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-300">사진 관리</p>
            <p className="mt-1 text-xs text-neutral-500">
              시설·훈련 사진을 올려주세요. 사진이 있는 체육관은 체험 신청률이 훨씬 높아요.
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {gym.photos.map((photo, i) => (
                <div key={photo.src + i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    className="h-20 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      update({ photos: gym.photos.filter((_, j) => j !== i) })
                    }
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white"
                  >
                    ✕
                  </button>
                  <p className="mt-1 truncate text-center text-[10px] text-neutral-500">
                    {photo.caption}
                  </p>
                </div>
              ))}
              <label className="flex h-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-700 text-neutral-500">
                <span className="text-lg">＋</span>
                <span className="text-[10px]">사진 추가</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // TODO(M2): Supabase Storage 업로드 + WebP 압축. 지금은 데모 미리보기.
                    update({
                      photos: [
                        ...gym.photos,
                        { src: URL.createObjectURL(file), caption: file.name.replace(/\.[^.]+$/, "") },
                      ],
                    });
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-300">시설 · 제공 사항</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {AMENITIES.map(({ key, emoji }) => {
                const on = gym.amenities.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleAmenity(key)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                      on
                        ? "border-red-800 bg-red-950/50 text-neutral-100"
                        : "border-neutral-800 bg-neutral-900 text-neutral-500"
                    }`}
                  >
                    {emoji} {key} {on && "✓"}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => setSaved(true)}
            className="mt-2 rounded-xl bg-red-600 py-3 font-bold text-white active:bg-red-700"
          >
            {saved ? "저장됨 ✓ (데모)" : "저장"}
          </button>
        </section>
      )}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium ${
        active
          ? "bg-red-600 text-white"
          : "border border-neutral-800 bg-neutral-900 text-neutral-400"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-neutral-300">{label}</span>
      {children}
    </label>
  );
}

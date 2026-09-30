"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AMENITIES, MOCK_GYMS, type Amenity, type Gym } from "@/lib/gyms";
import { type Booking } from "@/lib/store";
import {
  createEvent,
  deleteEventById,
  fetchBookings,
  fetchEventRoster,
  fetchGymEvents,
  fetchOwnerGym,
  uploadEventPoster,
  type RsvpEntry,
} from "@/lib/data.client";
import {
  EVENT_KINDS,
  eventKindEmoji,
  formatEventDate,
  formatFee,
  upcoming,
  type EventKind,
  type GymEvent,
} from "@/lib/events";

// 데모: 첫 번째 체육관의 관장이라고 가정.
// TODO(M1→M2): 로그인한 관장의 체육관을 Supabase에서 로드/저장
export default function AdminPage() {
  const [gym, setGym] = useState<Gym>(MOCK_GYMS[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<GymEvent[]>([]);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"info" | "bookings" | "events">("bookings");

  // 로그인 관장이 소유한 체육관이 있으면 그걸로 전환 (없으면 데모 기본 체육관)
  useEffect(() => {
    fetchOwnerGym().then((g) => {
      if (g) setGym(g);
    });
  }, []);

  useEffect(() => {
    fetchBookings().then((all) =>
      setBookings(all.filter((b) => b.gymId === gym.id))
    );
    fetchGymEvents(gym.id).then(setEvents);
  }, [gym.id]);

  // 이벤트 등록 → DB 저장 (RLS상 소유 체육관에만). 데모는 로컬.
  async function addEvent(
    ev: Omit<GymEvent, "id" | "gymId" | "gymName" | "attendees">
  ): Promise<{ error?: string }> {
    const res = await createEvent({ ...ev, gymId: gym.id, gymName: gym.name });
    if (res.event) {
      const created = res.event;
      setEvents((list) => upcoming([created, ...list]));
      return {};
    }
    return { error: res.error };
  }

  async function removeEvent(id: string) {
    const res = await deleteEventById(id);
    if (res.ok) setEvents((list) => list.filter((e) => e.id !== id));
  }

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
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← FightMate
      </Link>
      <h1 className="mt-4 text-xl font-bold md:text-2xl">관장님 페이지</h1>
      <p className="mt-1 text-sm text-neutral-500">{gym.name}</p>

      <div className="mt-6 flex gap-2">
        <TabButton active={tab === "bookings"} onClick={() => setTab("bookings")}>
          신청 목록 {bookings.length > 0 && `(${bookings.length})`}
        </TabButton>
        <TabButton active={tab === "events"} onClick={() => setTab("events")}>
          이벤트 {events.length > 0 && `(${events.length})`}
        </TabButton>
        <TabButton active={tab === "info"} onClick={() => setTab("info")}>
          체육관 정보
        </TabButton>
      </div>

      {tab === "bookings" && (
        <section className="mt-5">
          {bookings.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">
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
                  className="rounded-xl border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{b.name}</p>
                    <span className="rounded-md bg-orange-100 px-2 py-1 text-[11px] font-semibold text-orange-700">
                      {b.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {b.type} 희망일 {b.date} · {b.phone}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`tel:${b.phone}`}
                      className="flex-1 rounded-lg bg-neutral-100 py-2 text-center text-sm font-medium"
                    >
                      전화하기
                    </a>
                    <a
                      href={`sms:${b.phone}`}
                      className="flex-1 rounded-lg bg-neutral-100 py-2 text-center text-sm font-medium"
                    >
                      문자하기
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "events" && (
        <EventsTab events={events} onAdd={addEvent} onRemove={removeEvent} />
      )}

      {tab === "info" && (
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
            <p className="text-sm font-medium text-neutral-600">사진 관리</p>
            <p className="mt-1 text-xs text-neutral-400">
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
                  <p className="mt-1 truncate text-center text-[10px] text-neutral-400">
                    {photo.caption}
                  </p>
                </div>
              ))}
              <label className="flex h-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 text-neutral-400">
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
            <p className="text-sm font-medium text-neutral-600">시설 · 제공 사항</p>
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
                        ? "border-orange-300 bg-orange-100/50 text-neutral-900"
                        : "border-neutral-200 bg-white text-neutral-400"
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
            className="mt-2 rounded-xl bg-orange-500 py-3 font-bold text-white active:bg-orange-600"
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
          ? "bg-orange-500 text-white"
          : "border border-neutral-200 bg-white text-neutral-500"
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
      <span className="text-sm font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

function EventsTab({
  events,
  onAdd,
  onRemove,
}: {
  events: GymEvent[];
  onAdd: (
    ev: Omit<GymEvent, "id" | "gymId" | "gymName" | "attendees">
  ) => Promise<{ error?: string }>;
  onRemove: (id: string) => void;
}) {
  const [kind, setKind] = useState<EventKind>("오픈매트");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [fee, setFee] = useState("0");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [openToVisitors, setOpenToVisitors] = useState(true);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(events.length === 0);

  async function onPosterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setErr(null);
    const { url, error } = await uploadEventPoster(file);
    setUploading(false);
    if (error) {
      setErr(`포스터 업로드 실패: ${error}`);
      return;
    }
    setPosterUrl(url ?? null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSubmitting(true);
    setErr(null);
    const { error } = await onAdd({
      kind,
      title: title.trim(),
      date,
      startTime,
      fee: Number(fee) || 0,
      capacity: capacity ? Number(capacity) : null,
      description: description.trim(),
      posterUrl,
      openToVisitors,
    });
    setSubmitting(false);
    if (error) {
      setErr(`등록 실패: ${error}`);
      return;
    }
    setTitle("");
    setDate("");
    setFee("0");
    setCapacity("");
    setDescription("");
    setPosterUrl(null);
    setOpen(false);
  }

  return (
    <section className="mt-5">
      <p className="text-xs text-neutral-400">
        오픈매트·세미나·대회를 올리면 홈 피드와 체육관 페이지에 노출돼요. 신규 방문자 유입에 가장 효과적입니다.
      </p>

      {/* 등록된 이벤트 목록 */}
      <ul className="mt-4 flex flex-col gap-3">
        {events.map((ev) => (
          <AdminEventItem key={ev.id} event={ev} onRemove={onRemove} />
        ))}
        {events.length === 0 && (
          <li className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-400">
            아직 등록한 이벤트가 없어요
          </li>
        )}
      </ul>

      {/* 추가 토글 */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 w-full rounded-xl border border-dashed border-neutral-300 py-3 text-sm font-medium text-neutral-600"
        >
          ＋ 이벤트 등록
        </button>
      ) : (
        <form
          onSubmit={submit}
          className="mt-4 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4"
        >
          <div className="flex flex-wrap gap-1.5">
            {EVENT_KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => setKind(k.key)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  kind === k.key
                    ? "bg-orange-500 text-white"
                    : "border border-neutral-200 text-neutral-600"
                }`}
              >
                {k.emoji} {k.key}
              </button>
            ))}
          </div>
          <input
            className="input"
            placeholder="이벤트 제목 (예: 토요 오픈매트)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="날짜">
              <input
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="시작 시간">
              <input
                className="input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="참가비 (원, 0=무료)">
              <input
                className="input"
                type="number"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </Field>
            <Field label="정원 (빈칸=제한없음)">
              <input
                className="input"
                type="number"
                min="0"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </Field>
          </div>
          <Field label="상세 안내">
            <textarea
              className="input min-h-20 resize-none"
              placeholder="대상, 준비물, 진행 방식 등을 적어주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div>
            <p className="text-sm font-medium text-neutral-600">
              포스터 (선택)
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              대회·세미나 포스터를 올리면 피드와 상세 페이지에 크게 노출돼요.
            </p>
            {posterUrl ? (
              <div className="relative mt-2 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterUrl}
                  alt="포스터 미리보기"
                  className="h-44 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPosterUrl(null)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="mt-2 flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 text-neutral-400">
                <span className="text-lg">＋</span>
                <span className="text-xs">
                  {uploading ? "업로드 중…" : "포스터 이미지 추가"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={onPosterChange}
                />
              </label>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={openToVisitors}
              onChange={(e) => setOpenToVisitors(e.target.checked)}
            />
            타 체육관·외부인 참가 환영
          </label>

          {err && <p className="text-sm text-orange-600">{err}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-medium text-neutral-600"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white active:bg-orange-600 disabled:opacity-50"
            >
              {submitting ? "등록 중…" : "등록"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function AdminEventItem({
  event,
  onRemove,
}: {
  event: GymEvent;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [roster, setRoster] = useState<RsvpEntry[] | null>(null);

  async function toggleRoster() {
    if (!open && roster === null) {
      setRoster(await fetchEventRoster(event.id));
    }
    setOpen((v) => !v);
  }

  return (
    <li className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-neutral-500">
            {eventKindEmoji(event.kind)} {event.kind} · {formatEventDate(event.date)} {event.startTime}
          </p>
          <p className="mt-1 truncate font-semibold">{event.title}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {formatFee(event.fee)}
            {event.capacity != null ? ` · 신청 ${event.attendees}/${event.capacity}명` : ""}
          </p>
        </div>
        <button
          onClick={() => onRemove(event.id)}
          className="ml-3 shrink-0 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-500"
        >
          삭제
        </button>
      </div>

      <button
        onClick={toggleRoster}
        className="mt-3 w-full rounded-lg border border-neutral-200 py-2 text-xs font-medium text-neutral-600 active:bg-neutral-100"
      >
        {open ? "신청자 명단 접기" : "신청자 명단 보기"}
      </button>

      {open && (
        <div className="mt-2">
          {roster === null ? (
            <p className="py-2 text-center text-xs text-neutral-400">불러오는 중…</p>
          ) : roster.length === 0 ? (
            <p className="py-2 text-center text-xs text-neutral-400">
              아직 온라인 신청자가 없어요
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {roster.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{r.name || "이름 미입력"}</span>
                  {r.phone ? (
                    <a href={`tel:${r.phone}`} className="text-xs text-orange-600">
                      {r.phone}
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400">연락처 없음</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

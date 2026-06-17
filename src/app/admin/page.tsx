"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AMENITIES, MOCK_GYMS, type Amenity, type Gym } from "@/lib/gyms";
import { type Booking } from "@/lib/store";
import { fetchBookings } from "@/lib/data.client";
import {
  EVENT_KINDS,
  MOCK_EVENTS,
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

  useEffect(() => {
    fetchBookings().then((all) =>
      setBookings(all.filter((b) => b.gymId === gym.id))
    );
    // 데모: 목데이터에서 해당 체육관 이벤트 로드. (실제 저장은 M2 Supabase)
    setEvents(upcoming(MOCK_EVENTS.filter((e) => e.gymId === gym.id)));
  }, [gym.id]);

  function addEvent(ev: Omit<GymEvent, "id" | "gymId" | "gymName">) {
    const full: GymEvent = {
      ...ev,
      id: `ev-local-${Date.now()}`,
      gymId: gym.id,
      gymName: gym.name,
    };
    setEvents((list) => upcoming([full, ...list]));
  }

  function removeEvent(id: string) {
    setEvents((list) => list.filter((e) => e.id !== id));
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
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← FightMate
      </Link>
      <h1 className="mt-4 text-xl font-bold md:text-2xl">관장님 페이지</h1>
      <p className="mt-1 text-sm text-neutral-400">{gym.name}</p>

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

function EventsTab({
  events,
  onAdd,
  onRemove,
}: {
  events: GymEvent[];
  onAdd: (ev: Omit<GymEvent, "id" | "gymId" | "gymName">) => void;
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
  const [open, setOpen] = useState(events.length === 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onAdd({
      kind,
      title: title.trim(),
      date,
      startTime,
      fee: Number(fee) || 0,
      capacity: capacity ? Number(capacity) : null,
      description: description.trim(),
      openToVisitors,
    });
    setTitle("");
    setDate("");
    setFee("0");
    setCapacity("");
    setDescription("");
    setOpen(false);
  }

  return (
    <section className="mt-5">
      <p className="text-xs text-neutral-500">
        오픈매트·세미나·대회를 올리면 홈 피드와 체육관 페이지에 노출돼요. 신규 방문자 유입에 가장 효과적입니다.
      </p>

      {/* 등록된 이벤트 목록 */}
      <ul className="mt-4 flex flex-col gap-3">
        {events.map((ev) => (
          <li
            key={ev.id}
            className="flex items-start justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-4"
          >
            <div className="min-w-0">
              <p className="text-xs text-neutral-400">
                {eventKindEmoji(ev.kind)} {ev.kind} · {formatEventDate(ev.date)} {ev.startTime}
              </p>
              <p className="mt-1 truncate font-semibold">{ev.title}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {formatFee(ev.fee)}
                {ev.capacity ? ` · 정원 ${ev.capacity}명` : ""}
              </p>
            </div>
            <button
              onClick={() => onRemove(ev.id)}
              className="ml-3 shrink-0 rounded-lg border border-neutral-800 px-2.5 py-1 text-xs text-neutral-400"
            >
              삭제
            </button>
          </li>
        ))}
        {events.length === 0 && (
          <li className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-sm text-neutral-500">
            아직 등록한 이벤트가 없어요
          </li>
        )}
      </ul>

      {/* 추가 토글 */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 w-full rounded-xl border border-dashed border-neutral-700 py-3 text-sm font-medium text-neutral-300"
        >
          ＋ 이벤트 등록
        </button>
      ) : (
        <form
          onSubmit={submit}
          className="mt-4 flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4"
        >
          <div className="flex flex-wrap gap-1.5">
            {EVENT_KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => setKind(k.key)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  kind === k.key
                    ? "bg-red-600 text-white"
                    : "border border-neutral-800 text-neutral-300"
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
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={openToVisitors}
              onChange={(e) => setOpenToVisitors(e.target.checked)}
            />
            타 체육관·외부인 참가 환영
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-neutral-800 py-3 text-sm font-medium text-neutral-300"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white active:bg-red-700"
            >
              등록
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

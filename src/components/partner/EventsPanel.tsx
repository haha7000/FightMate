"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Plus, Trash2, Users, X } from "lucide-react";
import type { Gym } from "@/lib/gyms";
import {
  EVENT_KINDS,
  dateParts,
  formatFee,
  upcoming,
  type EventKind,
  type GymEvent,
} from "@/lib/events";
import {
  createEvent,
  deleteEventById,
  fetchEventRoster,
  fetchGymEvents,
  uploadEventPoster,
  type RsvpEntry,
} from "@/lib/data.client";

// 일정 관리: 오픈매트·세미나·대회 등록 → 홈·이벤트 탭에 바로 노출
export default function EventsPanel({ gym }: { gym: Gym }) {
  const [events, setEvents] = useState<GymEvent[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchGymEvents(gym.id).then((list) => {
      setEvents(list);
      if (list.length === 0) setFormOpen(true);
    });
  }, [gym.id]);

  async function remove(id: string) {
    if (!window.confirm("이 일정을 삭제할까요? 신청자 명단도 함께 사라져요.")) return;
    const res = await deleteEventById(id);
    if (res.ok) setEvents((list) => list?.filter((e) => e.id !== id) ?? null);
    else window.alert(`삭제하지 못했어요: ${res.error}`);
  }

  return (
    <section className="px-4 pt-4">
      <p className="text-[13px] leading-relaxed text-muted">
        올린 일정은 홈과 이벤트 탭에 바로 보여요. 다른 체육관 수련자가 찾아오는 가장 빠른 방법이에요.
      </p>

      {!formOpen && (
        <button
          onClick={() => setFormOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink py-3.5 text-[15px] font-bold text-white"
        >
          <Plus size={18} /> 일정 올리기
        </button>
      )}
      {formOpen && (
        <EventForm
          gym={gym}
          onCancel={() => setFormOpen(false)}
          onCreated={(ev) => {
            setEvents((list) => upcoming([ev, ...(list ?? [])]));
            setFormOpen(false);
          }}
        />
      )}

      <h2 className="mt-6 text-[15px] font-bold">다가오는 일정</h2>
      {events === null && <p className="py-10 text-center text-[14px] text-muted">불러오는 중…</p>}
      {events?.length === 0 && <p className="py-10 text-center text-[14px] text-muted">아직 올린 일정이 없어요</p>}
      <ul className="mt-2 flex flex-col gap-2">
        {events?.map((e) => (
          <EventItem key={e.id} event={e} onRemove={() => remove(e.id)} />
        ))}
      </ul>
    </section>
  );
}

function EventItem({ event: e, onRemove }: { event: GymEvent; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const [roster, setRoster] = useState<RsvpEntry[] | null>(null);
  const p = dateParts(e.date);

  async function toggleRoster() {
    if (!open && roster === null) setRoster(await fetchEventRoster(e.id));
    setOpen((v) => !v);
  }

  return (
    <li className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="w-12 shrink-0 rounded-lg bg-field py-1.5 text-center">
          <p className="text-[11px] text-muted">{p.m}월</p>
          <p className="text-[18px] font-bold leading-tight">{p.d}</p>
          <p className="text-[11px] text-muted">{p.ko}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-muted">
            {e.kind} · {e.startTime} · {formatFee(e.fee)}
          </p>
          <p className="mt-0.5 font-semibold leading-snug">{e.title}</p>
          <p className="mt-0.5 text-[12px] text-muted">
            신청 {e.attendees}
            {e.capacity != null ? `/${e.capacity}명` : "명"}
          </p>
        </div>
        <button onClick={onRemove} aria-label="삭제" className="-mr-1 shrink-0 p-1 text-muted">
          <Trash2 size={18} />
        </button>
      </div>

      <button
        onClick={toggleRoster}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-field py-2 text-[13px] font-semibold"
      >
        <Users size={15} /> {open ? "신청자 명단 접기" : "신청자 명단 보기"}
      </button>
      {open && (
        <ul className="mt-2 divide-y divide-line text-[14px]">
          {roster === null && <li className="py-2 text-center text-muted">불러오는 중…</li>}
          {roster?.length === 0 && <li className="py-2 text-center text-muted">아직 온라인 신청자가 없어요</li>}
          {roster?.map((r, i) => (
            <li key={i} className="flex items-center justify-between py-2">
              <span className="font-medium">{r.name || "이름 미입력"}</span>
              {r.phone ? (
                <a href={`tel:${r.phone}`} className="text-[13px] font-semibold text-brand tabular-nums">
                  {r.phone}
                </a>
              ) : (
                <span className="text-[13px] text-muted">연락처 없음</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function EventForm({
  gym,
  onCancel,
  onCreated,
}: {
  gym: Gym;
  onCancel: () => void;
  onCreated: (ev: GymEvent) => void;
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
  const today = new Date().toLocaleDateString("en-CA");

  async function onPoster(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setErr(null);
    const { url, error } = await uploadEventPoster(file);
    setUploading(false);
    if (error) setErr(`포스터 업로드 실패: ${error}`);
    else setPosterUrl(url ?? null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSubmitting(true);
    setErr(null);
    const res = await createEvent({
      gymId: gym.id,
      gymName: gym.name,
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
    if (res.event) onCreated(res.event);
    else setErr(`등록하지 못했어요: ${res.error}`);
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-4 rounded-xl border border-line bg-white p-4">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {EVENT_KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => setKind(k.key)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${
              kind === k.key ? "border-transparent bg-ink text-white" : "border-line"
            }`}
          >
            {k.key}
          </button>
        ))}
      </div>
      <input
        className="input"
        required
        placeholder="제목 (예: 토요 노기 오픈매트)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="날짜">
          <input className="input" type="date" required min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="시작 시간">
          <input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
        <Field label="참가비 (0 = 무료)">
          <input className="input" type="number" inputMode="numeric" min="0" value={fee} onChange={(e) => setFee(e.target.value)} />
        </Field>
        <Field label="정원 (비우면 제한 없음)">
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </Field>
      </div>
      <Field label="안내">
        <textarea
          className="input min-h-24 resize-none"
          placeholder="대상, 준비물(도복/노기), 진행 방식 등을 적어주세요."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div>
        <p className="text-[14px] font-semibold">포스터 (선택)</p>
        {posterUrl ? (
          <div className="relative mt-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={posterUrl} alt="포스터 미리보기" className="h-40 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setPosterUrl(null)}
              aria-label="포스터 빼기"
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="mt-2 flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-[13px] text-muted">
            <ImagePlus size={20} />
            {uploading ? "올리는 중…" : "포스터 이미지 추가"}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={onPoster} />
          </label>
        )}
      </div>

      <label className="flex items-center gap-2 text-[14px]">
        <input
          type="checkbox"
          className="h-5 w-5 accent-[var(--color-brand)]"
          checked={openToVisitors}
          onChange={(e) => setOpenToVisitors(e.target.checked)}
        />
        다른 체육관 수련자도 참가 가능
      </label>

      {err && <p className="text-[13px] text-red-600">{err}</p>}

      <div className="grid grid-cols-[1fr_1.6fr] gap-2 text-[15px] font-bold">
        <button type="button" onClick={onCancel} className="rounded-xl border border-line py-3">
          취소
        </button>
        <button type="submit" disabled={submitting || uploading} className="rounded-xl bg-brand py-3 text-white disabled:opacity-50">
          {submitting ? "올리는 중…" : "일정 올리기"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold">{label}</span>
      {children}
    </label>
  );
}

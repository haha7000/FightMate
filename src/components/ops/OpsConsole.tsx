"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Home, Link2, Plus, Store } from "lucide-react";
import { DISCIPLINES, type Discipline, type Gym } from "@/lib/gyms";
import {
  createInvite,
  fetchGymRequests,
  fetchMemberCounts,
  type GymRequestSummary,
} from "@/lib/partner.client";

type Prefill = { name: string; address: string; kakaoPlaceId: string | null };

export default function OpsConsole({ gyms }: { gyms: Gym[] }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [requests, setRequests] = useState<GymRequestSummary[] | null>(null);
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchMemberCounts().then(setCounts).catch(() => null);
    fetchGymRequests().then(setRequests).catch(() => setRequests([]));
  }, []);

  return (
    <main className="min-h-dvh pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="bg-white px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-brand">운영자</p>
          <Link href="/" aria-label="FightMate 홈" className="-mr-1 p-1 text-muted">
            <Home size={20} />
          </Link>
        </div>
        <h1 className="mt-1 text-[22px] font-bold">체육관 관리</h1>
        <p className="mt-1 text-[13px] text-muted">
          체육관 {gyms.length}곳 · 관장 연결 {Object.keys(counts).length}곳
        </p>
      </header>

      <section className="px-4 pt-5">
        {!formOpen ? (
          <button
            onClick={() => {
              setPrefill(null);
              setFormOpen(true);
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink py-3.5 text-[15px] font-bold text-white"
          >
            <Plus size={18} /> 체육관 등록
          </button>
        ) : (
          <GymCreateForm key={prefill?.kakaoPlaceId ?? "new"} prefill={prefill} onClose={() => setFormOpen(false)} />
        )}
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-[15px] font-bold">체육관</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {gyms.map((g) => (
            <GymRow key={g.id} gym={g} members={counts[g.id] ?? 0} />
          ))}
        </ul>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-[15px] font-bold">입점 요청</h2>
        <p className="mt-1 text-[12px] text-muted">지도에서 손님이 &ldquo;여기도 예약하고 싶어요&rdquo;를 누른 체육관. 영업 우선순위로 쓰세요.</p>
        {requests === null && <p className="py-8 text-center text-[14px] text-muted">불러오는 중…</p>}
        {requests?.length === 0 && <p className="py-8 text-center text-[14px] text-muted">아직 요청이 없어요</p>}
        <ul className="mt-2 flex flex-col gap-2">
          {requests?.map((r) => (
            <li key={r.placeId} className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.name}</p>
                  <p className="mt-0.5 truncate text-[12px] text-muted">{r.address}</p>
                  {r.phone && (
                    <a href={`tel:${r.phone}`} className="mt-0.5 inline-block text-[12px] font-semibold text-brand tabular-nums">
                      {r.phone}
                    </a>
                  )}
                </div>
                <span className="shrink-0 rounded-md bg-brand-tint px-2 py-1 text-[12px] font-bold text-brand">요청 {r.count}</span>
              </div>
              <button
                onClick={() => {
                  setPrefill({ name: r.name, address: r.address, kakaoPlaceId: r.placeId });
                  setFormOpen(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-field py-2 text-[13px] font-semibold"
              >
                <Store size={15} /> 이 정보로 체육관 등록
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function GymRow({ gym, members }: { gym: Gym; members: number }) {
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function invite() {
    setBusy(true);
    setErr(null);
    try {
      const token = await createInvite(gym.id, "owner");
      setLink(`${window.location.origin}/invite/${token}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "초대 링크를 만들지 못했어요");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard?.writeText(link).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <li className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{gym.name}</p>
          <p className="mt-0.5 text-[12px] text-muted">
            {gym.district} · {gym.disciplines.join("·")} · 사진 {gym.photos.length}장
          </p>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-1 text-[12px] font-semibold ${
            members > 0 ? "bg-brand-tint text-brand" : "bg-field text-muted"
          }`}
        >
          {members > 0 ? `관장 ${members}명` : "관장 없음"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[13px] font-semibold">
        <button onClick={invite} disabled={busy} className="flex items-center justify-center gap-1.5 rounded-lg bg-field py-2 disabled:opacity-50">
          <Link2 size={15} /> {busy ? "만드는 중…" : "관장 초대 링크"}
        </button>
        <Link href={`/partner?gym=${gym.id}`} className="flex items-center justify-center rounded-lg bg-field py-2">
          관장 모드로 보기
        </Link>
      </div>
      {err && <p className="mt-2 text-[12px] text-red-600">{err}</p>}
      {link && (
        <div className="mt-3 rounded-lg border border-line p-3">
          <p className="break-all text-[12px] tabular-nums">{link}</p>
          <p className="mt-1 text-[11px] text-muted">14일 동안 1번 사용 가능. 관장님께 카톡으로 보내주세요.</p>
          <button onClick={copy} className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-brand">
            <Copy size={14} /> {copied ? "복사했어요" : "링크 복사"}
          </button>
        </div>
      )}
    </li>
  );
}

function GymCreateForm({ prefill, onClose }: { prefill: Prefill | null; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(prefill?.name ?? "");
  const [address, setAddress] = useState(prefill?.address ?? "");
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [trialPrice, setTrialPrice] = useState("0");
  const [dayPassOn, setDayPassOn] = useState(true);
  const [dayPassPrice, setDayPassPrice] = useState("20000");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const res = await fetch("/api/ops/gyms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        disciplines,
        trialPrice: Number(trialPrice) || 0,
        dayPassPrice: dayPassOn ? Number(dayPassPrice) || 0 : null,
        kakaoPlaceId: prefill?.kakaoPlaceId ?? null,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!res.ok) return setErr(body.error ?? "등록하지 못했어요");
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-4">
      <p className="text-[15px] font-bold">체육관 등록</p>
      <input className="input" required placeholder="체육관 이름" value={name} onChange={(e) => setName(e.target.value)} />
      <input
        className="input"
        required
        placeholder="도로명 주소 (지도 위치를 자동으로 찾아요)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <div className="flex flex-wrap gap-1.5">
        {DISCIPLINES.map((d) => {
          const on = disciplines.includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDisciplines((list) => (on ? list.filter((x) => x !== d) : [...list, d]))}
              className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${
                on ? "border-transparent bg-ink text-white" : "border-line"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">체험 (0 = 무료)</span>
          <input className="input" type="number" inputMode="numeric" min="0" value={trialPrice} onChange={(e) => setTrialPrice(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold">
            <input type="checkbox" className="accent-[var(--color-brand)]" checked={dayPassOn} onChange={(e) => setDayPassOn(e.target.checked)} />
            1일권
          </span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            disabled={!dayPassOn}
            value={dayPassPrice}
            onChange={(e) => setDayPassPrice(e.target.value)}
          />
        </label>
      </div>
      <p className="text-[12px] text-muted">사진·소개·시설은 관장님이 관장 모드에서 직접 채우거나, 여기서 &ldquo;관장 모드로 보기&rdquo;로 대신 채울 수 있어요.</p>
      {err && <p className="text-[13px] text-red-600">{err}</p>}
      <div className="grid grid-cols-[1fr_1.6fr] gap-2 text-[15px] font-bold">
        <button type="button" onClick={onClose} className="rounded-xl border border-line py-3">
          취소
        </button>
        <button type="submit" disabled={saving || disciplines.length === 0} className="rounded-xl bg-brand py-3 text-white disabled:opacity-50">
          {saving ? "등록 중…" : "등록"}
        </button>
      </div>
    </form>
  );
}

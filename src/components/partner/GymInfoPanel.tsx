"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, X } from "lucide-react";
import { isPhoneNumber } from "@/lib/format";
import { AMENITIES, DISCIPLINES, type Discipline, type Gym } from "@/lib/gyms";
import { saveGym, uploadGymPhoto } from "@/lib/partner.client";
import { Field } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";

// 체육관 정보: 사진·소개·종목·가격·1일권 운영·시설. 저장하면 손님 페이지에 바로 반영.
export default function GymInfoPanel({ gym: initial }: { gym: Gym }) {
  const router = useRouter();
  const [gym, setGym] = useState<Gym>(initial);
  const [dayPassOn, setDayPassOn] = useState(initial.dayPassPrice != null);
  const [dayPassPrice, setDayPassPrice] = useState(String(initial.dayPassPrice ?? ""));
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function update(patch: Partial<Gym>) {
    setGym((g) => ({ ...g, ...patch }));
    setMessage(null);
  }

  function toggle<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  }

  const [timetableUploading, setTimetableUploading] = useState(false);
  async function onTimetable(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setTimetableUploading(true);
    try {
      update({ timetableUrl: await uploadGymPhoto(gym.id, file) });
    } catch (err) {
      setMessage({ ok: false, text: `시간표 업로드 실패: ${err instanceof Error ? err.message : ""}` });
    } finally {
      setTimetableUploading(false);
    }
  }

  async function onPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    setUploading((n) => n + files.length);
    for (const file of files) {
      try {
        const src = await uploadGymPhoto(gym.id, file);
        setGym((g) => ({ ...g, photos: [...g.photos, { src, caption: "" }] }));
        setMessage({ ok: true, text: "사진을 올렸어요. 저장을 눌러야 손님 페이지에 보여요." });
      } catch (err) {
        setMessage({ ok: false, text: `사진 업로드 실패: ${err instanceof Error ? err.message : ""}` });
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function movePhoto(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= gym.photos.length) return;
    const photos = [...gym.photos];
    [photos[i], photos[j]] = [photos[j], photos[i]];
    update({ photos });
  }

  async function save() {
    if (!gym.name.trim()) return setMessage({ ok: false, text: "체육관 이름을 입력해주세요" });
    if (gym.disciplines.length === 0) return setMessage({ ok: false, text: "종목을 하나 이상 골라주세요" });
    if (gym.phone?.trim() && !isPhoneNumber(gym.phone)) {
      return setMessage({ ok: false, text: "전화번호를 확인해주세요 (예: 02-123-4567)" });
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveGym({
        ...gym,
        name: gym.name.trim(),
        intro: gym.intro.trim(),
        dayPassPrice: dayPassOn ? Number(dayPassPrice) || 0 : null,
      });
      setMessage({ ok: true, text: "저장했어요. 손님 페이지에 바로 반영됐어요." });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: `저장하지 못했어요: ${err instanceof Error ? err.message : ""}` });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-6 px-4 pt-5">
      <div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-bold">사진</h2>
          <span className="text-[12px] text-muted">첫 번째 사진이 대표 사진</span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          매트·샤워실·수업 장면처럼 실제 모습이 보이는 사진일수록 신청이 많아요.
        </p>
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {gym.photos.map((p, i) => (
            <li key={p.src + i} className="relative aspect-square overflow-hidden rounded-lg bg-field">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.caption || `사진 ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-white">대표</span>
              )}
              <button
                type="button"
                aria-label="사진 빼기"
                onClick={() => update({ photos: gym.photos.filter((_, j) => j !== i) })}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <X size={14} />
              </button>
              {gym.photos.length > 1 && (
                <div className="absolute inset-x-1 bottom-1 flex justify-between">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => movePhoto(i, -1)}
                    className="rounded bg-black/60 px-1.5 text-[12px] text-white disabled:opacity-0"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={i === gym.photos.length - 1}
                    onClick={() => movePhoto(i, 1)}
                    className="rounded bg-black/60 px-1.5 text-[12px] text-white disabled:opacity-0"
                  >
                    →
                  </button>
                </div>
              )}
            </li>
          ))}
          <li>
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-[12px] text-muted">
              <ImagePlus size={20} />
              {uploading > 0 ? `올리는 중 ${uploading}` : "사진 추가"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={onPhotos} />
            </label>
          </li>
        </ul>
      </div>

      <Field label="체육관 이름">
        <input className="input" value={gym.name} onChange={(e) => update({ name: e.target.value })} />
      </Field>

      <Field label="체육관 전화번호 (손님에게 보여요)">
        <input
          className="input"
          type="tel"
          inputMode="tel"
          placeholder="02-123-4567"
          value={gym.phone ?? ""}
          onChange={(e) => update({ phone: e.target.value })}
        />
      </Field>

      <Field label="운영시간">
        <textarea
          className="input min-h-24 resize-none"
          placeholder={"평일 07:00 – 23:00\n토요일 10:00 – 18:00 (오픈매트 14시)\n일요일 휴무"}
          value={gym.hours ?? ""}
          onChange={(e) => update({ hours: e.target.value })}
        />
      </Field>

      <div>
        <p className="text-[14px] font-semibold">수업 시간표 (이미지)</p>
        <p className="mt-1 text-[12px] text-muted">카운터에 붙여둔 시간표를 찍어 올려도 돼요. 손님이 몇 시에 오면 되는지 알 수 있어요.</p>
        {gym.timetableUrl ? (
          <div className="relative mt-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gym.timetableUrl} alt="수업 시간표" className="max-h-60 rounded-lg border border-line object-contain" />
            <button
              type="button"
              aria-label="시간표 빼기"
              onClick={() => update({ timetableUrl: null })}
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="mt-2 flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-[13px] text-muted">
            <ImagePlus size={20} />
            {timetableUploading ? "올리는 중…" : "시간표 이미지 추가"}
            <input type="file" accept="image/*" className="hidden" disabled={timetableUploading} onChange={onTimetable} />
          </label>
        )}
      </div>

      <Field label="소개">
        <textarea
          className="input min-h-28 resize-none"
          placeholder="초보 클래스, 오픈매트 요일, 코치 경력처럼 손님이 궁금해할 내용을 적어주세요."
          value={gym.intro}
          onChange={(e) => update({ intro: e.target.value })}
        />
      </Field>

      <div>
        <p className="text-[14px] font-semibold">종목</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DISCIPLINES.map((d: Discipline) => (
            <Chip key={d} active={gym.disciplines.includes(d)} onClick={() => update({ disciplines: toggle(gym.disciplines, d) })}>
              {d}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="체험 1회 (원, 0 = 무료)">
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            value={gym.trialPrice}
            onChange={(e) => update({ trialPrice: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="정기권 월 (원, 선택)">
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            value={gym.monthlyPrice ?? ""}
            onChange={(e) => update({ monthlyPrice: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-line bg-white p-4">
        <label className="flex items-center justify-between">
          <span>
            <span className="block text-[14px] font-semibold">1일권 운영</span>
            <span className="text-[12px] text-muted">다른 체육관 수련자가 하루 운동하러 올 수 있어요</span>
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--color-brand)]"
            checked={dayPassOn}
            onChange={(e) => {
              setDayPassOn(e.target.checked);
              setMessage(null);
            }}
          />
        </label>
        {dayPassOn && (
          <input
            className="input mt-3"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="1일권 가격 (원)"
            value={dayPassPrice}
            onChange={(e) => {
              setDayPassPrice(e.target.value);
              setMessage(null);
            }}
          />
        )}
      </div>

      <div>
        <p className="text-[14px] font-semibold">시설·제공</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {AMENITIES.map((key) => {
            const on = gym.amenities.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => update({ amenities: toggle(gym.amenities, key) })}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[14px] ${
                  on ? "border-brand bg-brand-tint font-semibold" : "border-line bg-white text-muted"
                }`}
              >
                <Check size={16} strokeWidth={2.5} className={on ? "text-brand" : "opacity-0"} />
                {key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-paper/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        {message && (
          <p className={`mb-2 text-center text-[13px] ${message.ok ? "text-brand" : "text-red-600"}`}>{message.text}</p>
        )}
        <button
          onClick={save}
          disabled={saving || uploading > 0}
          className="w-full rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </section>
  );
}


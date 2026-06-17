"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import Link from "next/link";
import { DISCIPLINES } from "@/lib/gyms";
import { type FighterProfile } from "@/lib/store";
import { fetchProfile, saveProfile } from "@/lib/data.client";
import { useAuth } from "@/lib/auth";

const BELTS = ["해당 없음", "화이트", "블루", "퍼플", "브라운", "블랙"];

const EMPTY: FighterProfile = {
  nickname: "",
  discipline: "주짓수",
  weightClass: "",
  gymName: "",
  years: "",
  belt: "해당 없음",
};

export default function CardPage() {
  const [profile, setProfileState] = useState<FighterProfile>(EMPTY);
  const [saved, setSaved] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchProfile().then((stored) => {
      if (stored) setProfileState(stored);
    });
  }, []);

  function update(patch: Partial<FighterProfile>) {
    setProfileState((p) => ({ ...p, ...patch }));
    setSaved(false);
  }

  async function save() {
    await saveProfile(profile);
    setSaved(true);
  }

  async function downloadCard() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 3 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `fightmate-${profile.nickname || "card"}.png`;
    a.click();
  }

  const ready = profile.nickname.trim().length > 0;

  return (
    <main className="mx-auto max-w-5xl px-5 pb-16 pt-8 md:pt-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">내 파이터 카드</h1>
          <p className="mt-1 text-sm text-neutral-500">
            카드를 만들어 인스타에 공유해보세요
          </p>
        </div>
        {user ? (
          <button
            onClick={signOut}
            className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 md:hidden"
          >
            {user.name}님 · 로그아웃
          </button>
        ) : (
          <Link
            href="/login"
            className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 md:hidden"
          >
            로그인
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-start">
        {/* 카드 미리보기 */}
        <div className="md:sticky md:top-8 md:w-1/2">
          <div
            ref={cardRef}
            className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-black p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold tracking-[0.25em] text-orange-500">
                FIGHTMATE
              </p>
              <p className="text-[10px] text-neutral-400">FIGHTER CARD</p>
            </div>

            <p className="mt-6 text-3xl font-black italic">
              {profile.nickname || "닉네임"}
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              {profile.gymName || "소속 체육관"}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-neutral-700">
              <CardStat label="종목" value={profile.discipline} />
              <CardStat label="체급" value={profile.weightClass || "—"} />
              <CardStat label="수련" value={profile.years ? `${profile.years}년차` : "—"} />
              <CardStat
                label="벨트"
                value={profile.belt === "해당 없음" ? "—" : profile.belt}
              />
            </div>

            <p className="mt-5 text-center text-[10px] text-neutral-400">
              fightmate.kr
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={downloadCard}
              disabled={!ready}
              className="flex-1 rounded-xl bg-orange-500 py-3 font-bold text-white active:bg-orange-600 disabled:opacity-40"
            >
              이미지로 저장
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-neutral-400">
            저장한 이미지를 인스타 스토리에 올려보세요 🔥
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="flex flex-col gap-4 md:w-1/2">
          <Field label="닉네임">
            <input
              className="input"
              value={profile.nickname}
              onChange={(e) => update({ nickname: e.target.value })}
              placeholder="링네임 또는 닉네임"
            />
          </Field>
          <Field label="종목">
            <select
              className="input"
              value={profile.discipline}
              onChange={(e) => update({ discipline: e.target.value })}
            >
              {DISCIPLINES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="체급">
            <input
              className="input"
              value={profile.weightClass}
              onChange={(e) => update({ weightClass: e.target.value })}
              placeholder="-70kg"
            />
          </Field>
          <Field label="소속 체육관">
            <input
              className="input"
              value={profile.gymName}
              onChange={(e) => update({ gymName: e.target.value })}
              placeholder="탑팀 MMA 선릉"
            />
          </Field>
          <Field label="수련 기간 (년)">
            <input
              className="input"
              type="number"
              min="0"
              value={profile.years}
              onChange={(e) => update({ years: e.target.value })}
              placeholder="1"
            />
          </Field>
          <Field label="벨트 (주짓수)">
            <select
              className="input"
              value={profile.belt}
              onChange={(e) => update({ belt: e.target.value })}
            >
              {BELTS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>

          <button
            onClick={save}
            className="mt-2 rounded-xl border border-neutral-300 py-3 font-bold text-neutral-800 active:bg-neutral-100"
          >
            {saved ? "저장됨 ✓" : "프로필 저장"}
          </button>
        </div>
      </div>
    </main>
  );
}

function CardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-900 px-4 py-3">
      <p className="text-[10px] text-neutral-400">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-white">{value}</p>
    </div>
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

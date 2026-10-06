"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import Link from "next/link";
import { ChevronRight, Download, ShieldCheck, Store } from "lucide-react";
import { DISCIPLINES } from "@/lib/gyms";
import { type FighterProfile } from "@/lib/store";
import { fetchMyFighterPath, fetchProfile, saveProfile } from "@/lib/data.client";
import { useAuth } from "@/lib/auth";
import { fetchMyRoles } from "@/lib/partner.client";
import { Field } from "@/components/ui/Field";
import { LegalLinks } from "@/components/LegalLinks";
import AccountDelete from "@/components/AccountDelete";
import { FighterCardView } from "@/components/FighterCardView";

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
  const [roles, setRoles] = useState<{ isAdmin: boolean; gymCount: number }>({ isAdmin: false, gymCount: 0 });
  const [publicUrl, setPublicUrl] = useState<string | null>(null); // 공개 프로필 주소 (저장된 프로필이 있을 때만)
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchMyFighterPath()]).then(([stored, path]) => {
      if (stored) setProfileState(stored);
      if (stored?.nickname.trim() && path) setPublicUrl(`${window.location.origin}${path}`);
    });
    fetchMyRoles()
      .then(setRoles)
      .catch(() => null); // 역할 테이블이 아직 없으면 입구를 숨김
  }, []);

  function update(patch: Partial<FighterProfile>) {
    setProfileState((p) => ({ ...p, ...patch }));
    setSaved(false);
  }

  // 공개 프로필 주소가 생기면 카드에 넣을 QR을 만든다
  useEffect(() => {
    if (!publicUrl) return;
    QRCode.toDataURL(publicUrl, { margin: 0, width: 192 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [publicUrl]);

  async function save() {
    await saveProfile(profile);
    setSaved(true);
    const path = profile.nickname.trim() ? await fetchMyFighterPath() : null;
    setPublicUrl(path ? `${window.location.origin}${path}` : null);
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
    <main className="min-h-dvh">
      <header className="flex items-start justify-between bg-white px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-4">
        <div>
          <h1 className="text-[22px] font-bold">내 파이터 카드</h1>
          <p className="mt-1 text-[13px] text-muted">카드를 만들어 인스타 스토리에 올려보세요</p>
        </div>
        {user ? (
          <button
            onClick={signOut}
            className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-[12px] text-muted"
          >
            {user.name}님 · 로그아웃
          </button>
        ) : (
          <Link href="/login" className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-[12px] font-semibold text-white">
            로그인
          </Link>
        )}
      </header>

      {(roles.gymCount > 0 || roles.isAdmin) && (
        <div className="mx-4 mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          <Link href="/partner" className="flex items-center gap-3 px-4 py-3.5 active:bg-field">
              <Store size={20} className="text-brand" />
              <span className="flex-1">
                <span className="block text-[15px] font-semibold">관장 모드</span>
                <span className="text-[12px] text-muted">신청 확인 · 일정 · 체육관 정보 · 홍보</span>
              </span>
              <ChevronRight size={18} className="text-muted" />
            </Link>
          {roles.isAdmin && (
            <Link href="/ops" className="flex items-center gap-3 px-4 py-3.5 active:bg-field">
              <ShieldCheck size={20} className="text-ink" />
              <span className="flex-1">
                <span className="block text-[15px] font-semibold">운영자</span>
                <span className="text-[12px] text-muted">체육관 등록 · 관장 초대 · 입점 요청</span>
              </span>
              <ChevronRight size={18} className="text-muted" />
            </Link>
          )}
        </div>
      )}

      <div className="px-4 pt-5">
        {/* 카드 미리보기 — 이미지로 저장되는 영역 */}
        <div ref={cardRef}>
          <FighterCardView profile={profile} qr={qr} />
        </div>

        <button
          onClick={downloadCard}
          disabled={!ready}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white disabled:opacity-40"
        >
          <Download size={18} />
          이미지로 저장
        </button>
        {!ready && <p className="mt-2 text-center text-[12px] text-muted">닉네임을 입력하면 저장할 수 있어요</p>}
        {publicUrl ? (
          <p className="mt-2 text-center text-[12px] text-muted">
            카드의 QR을 찍으면{" "}
            <a href={publicUrl} className="font-semibold text-brand underline underline-offset-2">
              내 공개 프로필
            </a>
            로 가요 (닉네임·종목·소속·체급·수련 기간·벨트만 보여요)
          </p>
        ) : (
          user && ready && <p className="mt-2 text-center text-[12px] text-muted">프로필을 저장하면 카드에 내 프로필 QR이 들어가요</p>
        )}
      </div>

      <section className="mt-6 bg-white px-4 py-5">
        <h2 className="text-[16px] font-bold">프로필</h2>
        <div className="mt-4 flex flex-col gap-4">
          <Field label="닉네임">
            <input
              className="input"
              value={profile.nickname}
              onChange={(e) => update({ nickname: e.target.value })}
              placeholder="링네임 또는 닉네임"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="종목">
              <select className="input" value={profile.discipline} onChange={(e) => update({ discipline: e.target.value })}>
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
          </div>
          <Field label="소속 체육관">
            <input
              className="input"
              value={profile.gymName}
              onChange={(e) => update({ gymName: e.target.value })}
              placeholder="탑팀 MMA 선릉"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="수련 기간 (년)">
              <input
                className="input"
                type="number"
                inputMode="numeric"
                min="0"
                value={profile.years}
                onChange={(e) => update({ years: e.target.value })}
                placeholder="1"
              />
            </Field>
            <Field label="벨트 (주짓수)">
              <select className="input" value={profile.belt} onChange={(e) => update({ belt: e.target.value })}>
                {BELTS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
          </div>
          <button
            onClick={save}
            className="mt-1 rounded-xl border border-ink py-3 text-[15px] font-bold active:bg-field"
          >
            {saved ? "저장됨" : "프로필 저장"}
          </button>
        </div>
      </section>
      <LegalLinks />
      {user && <AccountDelete />}
    </main>
  );
}

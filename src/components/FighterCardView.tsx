import { DISCIPLINE_EN, type Discipline } from "@/lib/gyms";
import type { FighterProfile } from "@/lib/store";

// 파이터 카드 본체 — 내 카드 탭(이미지 저장)과 공개 프로필 페이지가 같이 쓴다.
// qr: 공개 프로필로 가는 QR 이미지(data URL). 있으면 카드 아래쪽에 넣어 인스타 스토리에서 바로 찍히게.
export function FighterCardView({ profile, qr }: { profile: FighterProfile; qr?: string | null }) {
  return (
    <div className="grain overflow-hidden bg-night p-6 text-white">
      <div className="flex items-center justify-between">
        <p className="font-num text-[13px] tracking-[0.18em]">
          FIGHT<span className="text-brand-bright">MATE</span>
        </p>
        <p className="font-num text-[11px] tracking-[0.24em] text-white/45">FIGHTER CARD</p>
      </div>

      <p className="mt-8 font-num text-[12px] tracking-[0.24em] text-brand-bright">
        {DISCIPLINE_EN[profile.discipline as Discipline] ?? profile.discipline}
      </p>
      <p className="mt-1 font-display text-[44px] leading-[1.05]">{profile.nickname || "닉네임"}</p>
      <p className="mt-2 text-[14px] text-white/60">{profile.gymName || "소속 체육관"}</p>

      <dl className="mt-8 grid grid-cols-3 border-y border-white/15">
        <Stat label="체급" value={profile.weightClass || "—"} />
        <Stat label="수련" value={profile.years ? `${profile.years}Y` : "—"} />
        <Stat label="벨트" value={profile.belt === "해당 없음" ? "—" : profile.belt} last />
      </dl>

      <div className="mt-6 flex items-end justify-between">
        <p className="font-num text-[11px] tracking-[0.24em] text-white/40">FIGHTMATE.KR</p>
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="프로필 QR" className="h-16 w-16 rounded-md bg-white p-1" />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`py-3 ${last ? "" : "border-r border-white/15"} ${label === "체급" ? "pr-3" : "px-3"}`}>
      <dd className="truncate font-num text-[22px] leading-none">{value}</dd>
      <dt className="mt-1.5 text-[11px] text-white/50">{label}</dt>
    </div>
  );
}

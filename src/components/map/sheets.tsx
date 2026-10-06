"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Map as MapIcon, Navigation, Phone, X } from "lucide-react";
import { offersDayPass, type Gym } from "@/lib/gyms";
import { formatDistance, type Place } from "@/lib/places";
import { formatWon } from "@/lib/format";

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
const REQUESTED_KEY = "fm_gym_requests"; // 이 기기에서 입점 요청한 장소 ID


function SheetHeader({ title, sub, onClose }: { title: string; sub: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-[18px] font-bold">{title}</h2>
        <p className="mt-0.5 text-[12px] text-muted">{sub}</p>
      </div>
      <button onClick={onClose} aria-label="닫기" className="-mr-1 shrink-0 p-1 text-muted">
        <X size={20} />
      </button>
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((d) => (
        <span key={d} className="rounded bg-field px-1.5 py-0.5 text-[11px] font-medium">
          {d}
        </span>
      ))}
    </div>
  );
}

// 입점 체육관: 우리 상세페이지·체험/1일권 신청으로 연결
export function GymSheet({ gym, distance, onClose }: { gym: Gym; distance: number | null; onClose: () => void }) {
  const dayPass = offersDayPass(gym);
  return (
    <div className="p-4">
      <p className="mb-2 inline-block rounded-md bg-brand-tint px-2 py-0.5 text-[11px] font-bold text-brand">
        FightMate 입점 · 전화 없이 바로 예약
      </p>
      <SheetHeader
        title={gym.name}
        sub={[distance != null && formatDistance(distance), gym.district, `★ ${gym.rating}`].filter(Boolean).join(" · ")}
        onClose={onClose}
      />
      <Tags items={gym.disciplines} />
      <p className="mt-3 text-[14px] text-muted tabular-nums">
        체험 <b className="text-ink">{formatWon(gym.trialPrice)}</b>
        <span className="mx-1.5 text-line">|</span>
        {dayPass ? (
          <>
            1일권 <b className="text-ink">{formatWon(gym.dayPassPrice!)}</b>
          </>
        ) : (
          "1일권 없음"
        )}
      </p>
      <div className="mt-4 grid grid-cols-[1fr_1.6fr] gap-2 text-[14px] font-bold">
        <Link
          href={dayPass ? `/gym/${gym.id}/apply?type=daypass` : `/gym/${gym.id}`}
          className="rounded-xl border border-ink py-3 text-center"
        >
          {dayPass ? "1일권 예약" : "상세보기"}
        </Link>
        <Link href={`/gym/${gym.id}/apply`} className="rounded-xl bg-brand py-3 text-center text-white">
          체험 신청 · {formatWon(gym.trialPrice)}
        </Link>
      </div>
      {dayPass && (
        <Link href={`/gym/${gym.id}`} className="mt-3 block text-center text-[13px] font-semibold text-muted">
          체육관 자세히 보기
        </Link>
      )}
    </div>
  );
}

function readRequested(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(REQUESTED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

// 미입점 장소: 카카오 정보 + 입점 요청
export function PlaceSheet({ place, distance, onClose }: { place: Place; distance: number | null; onClose: () => void }) {
  // 장소마다 key로 새로 마운트되므로 초기값만 읽으면 된다 (선택 후에만 렌더 → 서버 렌더 없음)
  const [requested, setRequested] = useState(() => readRequested().includes(place.id));
  const [sending, setSending] = useState(false);

  async function requestPartner() {
    setSending(true);
    await fetch("/api/gym-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: place.id, name: place.name, address: place.address, phone: place.phone }),
    }).catch(() => null);
    try {
      window.localStorage.setItem(REQUESTED_KEY, JSON.stringify([...new Set([...readRequested(), place.id])]));
    } catch {
      // 저장 실패해도 요청 자체는 전송됨
    }
    setSending(false);
    setRequested(true);
  }

  const directions = `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.lat},${place.lng}`;
  const action = "flex flex-col items-center gap-1 rounded-xl bg-field py-2.5";

  return (
    <div className="p-4">
      <SheetHeader
        title={place.name}
        sub={[distance != null && formatDistance(distance), place.category].filter(Boolean).join(" · ")}
        onClose={onClose}
      />
      <p className="mt-2 text-[14px] text-muted">{place.address}</p>
      <Tags items={place.disciplines} />

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px] font-semibold">
        {place.phone ? (
          <a href={`tel:${place.phone}`} className={action}>
            <Phone size={18} />
            전화
          </a>
        ) : (
          <span className={`${action} text-muted/50`}>
            <Phone size={18} />
            전화
          </span>
        )}
        <a href={directions} target="_blank" rel="noopener noreferrer" className={action}>
          <Navigation size={18} />
          길찾기
        </a>
        <a href={place.url} target="_blank" rel="noopener noreferrer" className={action}>
          <ExternalLink size={18} />
          카카오맵
        </a>
      </div>

      <button
        onClick={requestPartner}
        disabled={requested || sending}
        className="mt-3 w-full rounded-xl bg-brand-tint py-3 text-[14px] font-bold text-brand disabled:opacity-80"
      >
        {requested
          ? "입점 요청 완료. 관장님께 전해드릴게요"
          : sending
            ? "요청 중…"
            : "여기도 전화 없이 예약하고 싶어요 (입점 요청)"}
      </button>
    </div>
  );
}

export function SdkErrorView() {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-paper p-6 text-center">
      <div>
        <MapIcon size={36} className="mx-auto text-muted" />
        <p className="mt-3 font-bold">지도를 불러오지 못했어요</p>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {KAKAO_JS_KEY ? (
            <>
              카카오 개발자 콘솔 → 플랫폼 키 → JavaScript SDK 도메인에
              <br />
              <code className="rounded bg-field px-1.5 py-0.5 text-ink">{origin}</code>
              <br />이 등록돼 있는지 확인해주세요.
            </>
          ) : (
            "NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았어요."
          )}
        </p>
      </div>
    </div>
  );
}

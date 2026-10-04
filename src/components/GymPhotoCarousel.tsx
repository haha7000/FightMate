"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Share } from "lucide-react";
import type { GymPhoto } from "@/lib/gyms";

// 체육관 상세 상단: 좌우로 넘기는 사진 + 뒤로가기·공유 버튼 + "1 / 3"
export default function GymPhotoCarousel({ photos, name }: { photos: GymPhoto[]; name: string }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  function back() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  // 관장님이 인스타·카톡에 퍼갈 수 있게: 폰 공유 창 → 안 되면 링크 복사
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${name} — FightMate`, url }).catch(() => null);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-field">
      {photos.length > 0 ? (
        <div
          className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.src + i}
              src={p.src}
              alt={`${name} ${p.caption}`}
              className="h-full w-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center font-display text-[40px] text-muted">
          {name.slice(0, 2)}
        </div>
      )}

      <div className="absolute inset-x-0 top-0 flex justify-between p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <button
          onClick={back}
          aria-label="뒤로"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={share}
          aria-label="공유"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
        >
          <Share size={18} />
        </button>
      </div>

      {photos.length > 1 && (
        <span className="absolute bottom-7 right-3 rounded-full bg-black/55 px-2 py-0.5 text-[12px] text-white tabular-nums">
          {index + 1} / {photos.length}
        </span>
      )}
      {photos[index]?.caption && (
        <span className="absolute bottom-7 left-3 rounded-full bg-black/55 px-2 py-0.5 text-[12px] text-white">
          {photos[index].caption}
        </span>
      )}
      {copied && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/80 px-3 py-2 text-[13px] text-white">
          링크를 복사했어요
        </span>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { Copy, Download, Share } from "lucide-react";
import { formatPrice, offersDayPass, type Gym } from "@/lib/gyms";

// 홍보 키트: 체육관 페이지 링크 + 카운터·탈의실에 붙일 QR 포스터
export default function PromotePanel({ gym }: { gym: Gym }) {
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const link = `${window.location.origin}/gym/${gym.id}`;
    QRCode.toDataURL(link, { width: 640, margin: 1 }).then((data) => {
      setUrl(link);
      setQr(data);
    });
  }, [gym.id]);

  async function copy() {
    await navigator.clipboard?.writeText(url).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    if (navigator.share) await navigator.share({ title: gym.name, url }).catch(() => null);
    else copy();
  }

  async function savePoster() {
    if (!posterRef.current) return;
    const data = await toPng(posterRef.current, { pixelRatio: 3 });
    const a = document.createElement("a");
    a.href = data;
    a.download = `fightmate-${gym.id}-qr.png`;
    a.click();
  }

  return (
    <section className="flex flex-col gap-6 px-4 pt-5">
      <div>
        <h2 className="text-[15px] font-bold">우리 체육관 링크</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          네이버 플레이스의 예약·홈페이지 칸, 인스타 프로필 링크, 카톡 채널에 걸어두세요. 손님이 전화 없이 바로 신청해요.
        </p>
        <div className="mt-3 truncate rounded-lg bg-field px-3 py-3 text-[13px] tabular-nums">{url || "…"}</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[14px] font-semibold">
          <button onClick={copy} className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white py-2.5">
            <Copy size={16} /> {copied ? "복사했어요" : "링크 복사"}
          </button>
          <button onClick={share} className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white py-2.5">
            <Share size={16} /> 공유
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-[15px] font-bold">QR 포스터</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          카운터나 탈의실에 붙여두면, 지인 데려온 회원이 바로 체험을 신청할 수 있어요.
        </p>

        {/* 이미지로 저장되는 영역 */}
        <div ref={posterRef} className="grain mt-3 bg-night px-6 pt-7 pb-6 text-center text-white">
          <p className="font-num text-[13px] tracking-[0.2em]">
            FIGHT<span className="text-brand-bright">MATE</span>
          </p>
          <p className="mt-4 font-display text-[30px] leading-[1.1]">{gym.name}</p>
          <p className="mt-2 text-[14px] text-white/70">전화 없이, 링크 하나로 체험 예약</p>
          <div className="mx-auto mt-5 w-[200px] bg-white p-3">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt={`${gym.name} 예약 QR`} className="h-auto w-full" />
            ) : (
              <div className="aspect-square" />
            )}
          </div>
          <div className="mt-5 flex justify-center gap-6 text-[13px]">
            <span>
              <span className="block font-num text-[22px] leading-none text-brand-bright">
                {gym.trialPrice === 0 ? "FREE" : formatPrice(gym.trialPrice)}
              </span>
              <span className="text-white/60">체험</span>
            </span>
            {offersDayPass(gym) && (
              <span>
                <span className="block font-num text-[22px] leading-none">{gym.dayPassPrice!.toLocaleString("ko-KR")}</span>
                <span className="text-white/60">1일권</span>
              </span>
            )}
          </div>
          <p className="mt-5 text-[12px] text-white/50">카메라로 QR을 비추세요</p>
        </div>

        <button
          onClick={savePoster}
          disabled={!qr}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white disabled:opacity-50"
        >
          <Download size={18} /> 포스터 이미지 저장
        </button>
      </div>
    </section>
  );
}

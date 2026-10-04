"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { redeemInvite } from "@/lib/partner.client";

export default function InviteAccept({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const gymId = await redeemInvite(token);
      router.push(`/partner?gym=${gymId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "연결하지 못했어요");
      setBusy(false);
    }
  }

  return (
    <div>
      {error && <p className="mb-3 rounded-lg bg-red-500/15 px-3 py-2 text-center text-[13px] text-red-300">{error}</p>}
      <button
        onClick={accept}
        disabled={busy}
        className="w-full rounded-xl bg-brand-bright py-3.5 text-[16px] font-bold text-night disabled:opacity-60"
      >
        {busy ? "연결 중…" : "내 체육관으로 연결하기"}
      </button>
    </div>
  );
}

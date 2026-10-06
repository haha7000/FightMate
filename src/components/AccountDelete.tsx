"use client";

import { useState } from "react";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";

// 내 카드 탭 맨 아래 "회원 탈퇴" — 무엇이 지워지는지 알리고 한 번 더 확인
export default function AccountDelete() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (res.ok) {
      window.location.href = "/";
      return;
    }
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setError(body.error ?? "탈퇴를 처리하지 못했어요");
    setBusy(false);
    setOpen(false);
  }

  return (
    <div className="px-4 pb-2 text-center">
      <button onClick={() => setOpen(true)} className="text-[12px] text-muted underline underline-offset-2">
        회원 탈퇴
      </button>
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
      {open && (
        <ConfirmSheet
          title="정말 탈퇴할까요?"
          confirmLabel="탈퇴하기"
          danger
          busy={busy}
          onCancel={() => setOpen(false)}
          onConfirm={withdraw}
        >
          계정, 파이터 카드, 이벤트 참가 신청이 삭제되고 되돌릴 수 없어요. 체험·1일권 신청 기록은 체육관 장부로 남지만 이름과
          연락처는 지워져요. 내가 쓴 리뷰는 &ldquo;탈퇴한 회원&rdquo;으로 표시돼요.
        </ConfirmSheet>
      )}
    </div>
  );
}

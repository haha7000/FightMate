"use client";

// 아래에서 올라오는 확인 시트 (브라우저 기본 confirm 대신). 되돌리기 어려운 동작 전에 한 번 더 묻는다.
export function ConfirmSheet({
  title,
  children,
  confirmLabel,
  cancelLabel = "취소",
  danger = false,
  busy = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  children?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean; // 거절·탈퇴처럼 되돌리기 어려운 동작은 빨간 버튼
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45" onClick={busy ? undefined : onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-t-2xl bg-white px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
      >
        <h3 className="text-[18px] font-bold">{title}</h3>
        {children && <div className="mt-2 text-[14px] leading-relaxed text-muted">{children}</div>}
        <div className="mt-5 grid grid-cols-2 gap-2 text-[15px] font-bold">
          <button onClick={onCancel} disabled={busy} className="rounded-xl bg-field py-3.5 disabled:opacity-50">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            className={`rounded-xl py-3.5 text-white disabled:opacity-50 ${danger ? "bg-red-600" : "bg-brand"}`}
          >
            {busy ? "처리 중…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

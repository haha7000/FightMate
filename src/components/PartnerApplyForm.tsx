"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { APPLY_LIMITS } from "@/lib/partner-apply";

// 관장님 입점 신청 폼 → 운영자 화면 "관장 입점 신청"에 쌓인다
export default function PartnerApplyForm() {
  const [gymName, setGymName] = useState("");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymName, address, ownerName, phone, message, agreed }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error);
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "신청에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center rounded-xl bg-white px-5 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint">
          <Check size={28} strokeWidth={2.75} className="text-brand" />
        </span>
        <p className="mt-4 text-[18px] font-bold">입점 신청을 받았어요</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
          확인 후 적어주신 번호로 연락드릴게요.
          <br />
          체육관 등록이 끝나면 관장 모드 초대 링크를 보내드려요.
        </p>
        <Link href="/" className="mt-6 rounded-xl bg-field px-6 py-3 text-[15px] font-bold">
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl bg-white p-5">
      <Field label="체육관 이름">
        <input
          className="input"
          required
          maxLength={APPLY_LIMITS.gymName}
          value={gymName}
          onChange={(e) => setGymName(e.target.value)}
          placeholder="예: 그레이시 주짓수 역삼"
        />
      </Field>
      <Field label="주소 (선택)">
        <input
          className="input"
          maxLength={APPLY_LIMITS.address}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="도로명 주소"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="성함">
          <input
            className="input"
            required
            autoComplete="name"
            maxLength={APPLY_LIMITS.ownerName}
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="홍길동 관장"
          />
        </Field>
        <Field label="연락처">
          <input
            className="input"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
          />
        </Field>
      </div>
      <Field label="남기실 말 (선택)">
        <textarea
          className="input min-h-24 resize-none"
          maxLength={APPLY_LIMITS.message}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="종목, 체험·1일권 운영 여부, 통화 편한 시간 등"
        />
      </Field>

      <label className="flex items-start gap-2.5 rounded-xl bg-field p-3 text-[13px] leading-relaxed">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-brand)]"
        />
        <span>
          <b>(필수)</b> 입점 상담 연락을 위해 성함·연락처·체육관 정보를 수집하는 데 동의합니다.{" "}
          <Link href="/privacy" className="text-muted underline underline-offset-2">
            자세히
          </Link>
        </span>
      </label>

      {error && <p className="text-[14px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !agreed}
        className="rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white disabled:opacity-50"
      >
        {submitting ? "보내는 중…" : "입점 신청하기"}
      </button>
    </form>
  );
}

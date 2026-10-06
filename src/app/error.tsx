"use client"; // 에러 경계는 클라이언트 컴포넌트여야 한다

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";

// 데이터 조회 실패 등 예상 못 한 오류. 실서비스에선 원인 대신 식별 코드(digest)만 넘어온다.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-num text-[44px] tracking-[0.08em] text-muted/40">ERROR</p>
      <h1 className="mt-2 text-[20px] font-bold">잠시 연결이 불안정해요</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">
        정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
      </p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
        <button
          onClick={() => unstable_retry()}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white"
        >
          <RotateCw size={17} /> 다시 시도
        </button>
        <Link href="/" className="rounded-xl bg-field py-3.5 text-[15px] font-bold">
          홈으로
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-[11px] text-muted/70">오류 코드 {error.digest}</p>}
    </main>
  );
}

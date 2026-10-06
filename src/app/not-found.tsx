import Link from "next/link";

// 없는 체육관·이벤트 주소, 잘못된 링크
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-num text-[64px] leading-none tracking-[0.06em] text-muted/40">404</p>
      <h1 className="mt-3 text-[20px] font-bold">찾을 수 없는 페이지예요</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">
        주소가 바뀌었거나, 체육관·일정이 내려갔을 수 있어요.
      </p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
        <Link href="/" className="rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white">
          체육관 둘러보기
        </Link>
        <Link href="/events" className="rounded-xl bg-field py-3.5 text-[15px] font-bold">
          이번 주 일정 보기
        </Link>
      </div>
    </main>
  );
}

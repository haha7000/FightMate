import Link from "next/link";

// 화면 맨 아래 약관 링크 (홈·내 카드)
export function LegalLinks() {
  return (
    <footer className="px-4 py-8 text-center text-[12px] text-muted">
      <Link href="/terms" className="underline-offset-2 hover:underline">
        이용약관
      </Link>
      <span className="mx-2 text-line">|</span>
      <Link href="/privacy" className="font-semibold underline-offset-2 hover:underline">
        개인정보처리방침
      </Link>
      <p className="mt-2">© FightMate</p>
    </footer>
  );
}

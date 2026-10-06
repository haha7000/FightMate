// 화면 표시용 포맷 함수 모음 (서버·클라이언트 공용)

/** 원 단위 금액. 0이면 "무료" */
export function formatWon(amount: number): string {
  return amount === 0 ? "무료" : `${amount.toLocaleString("ko-KR")}원`;
}

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** 휴대폰 번호 여부 (010·011·016~019, 하이픈 무관) */
export function isMobilePhone(s: string): boolean {
  return /^01[016789]\d{7,8}$/.test(digitsOnly(s));
}

/** "01012345678" → "010-1234-5678" */
export function formatPhone(s: string): string {
  return digitsOnly(s).replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
}

/** "2026-10-06" 또는 ISO 시각 → "10/6" */
export function monthDay(dateOrIso: string): string {
  const [, m, d] = dateOrIso.slice(0, 10).split("-").map(Number);
  return `${m}/${d}`;
}

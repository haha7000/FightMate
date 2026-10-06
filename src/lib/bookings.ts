// 체험·1일권 신청의 종류와 상태. DB에는 text로 저장되므로 읽을 때 검증해서 좁힌다.

export const BOOKING_TYPES = ["체험", "1일권"] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

export const BOOKING_STATUSES = ["신청됨", "확정", "거절", "사용 완료", "취소"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export function toBookingType(s: string): BookingType {
  return (BOOKING_TYPES as readonly string[]).includes(s) ? (s as BookingType) : "체험";
}

export function toBookingStatus(s: string): BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(s) ? (s as BookingStatus) : "신청됨";
}

// 희망 시간대 (신청 폼)
export const PREFERRED_TIMES = ["오전", "오후", "저녁", "상관없음"] as const;
export type PreferredTime = (typeof PREFERRED_TIMES)[number];

export function toPreferredTime(s: string | null | undefined): PreferredTime | null {
  return s && (PREFERRED_TIMES as readonly string[]).includes(s) ? (s as PreferredTime) : null;
}

export const NOTE_MAX = 300; // 요청사항 최대 글자 수

// 손님이 취소할 수 있는 상태 (DB 함수 cancel_my_booking과 같은 규칙)
export function canCustomerCancel(status: BookingStatus): boolean {
  return status === "신청됨" || status === "확정";
}

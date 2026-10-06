// 체험·1일권 신청의 종류와 상태. DB에는 text로 저장되므로 읽을 때 검증해서 좁힌다.

export const BOOKING_TYPES = ["체험", "1일권"] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

export const BOOKING_STATUSES = ["신청됨", "확정", "거절", "사용 완료"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export function toBookingType(s: string): BookingType {
  return (BOOKING_TYPES as readonly string[]).includes(s) ? (s as BookingType) : "체험";
}

export function toBookingStatus(s: string): BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(s) ? (s as BookingStatus) : "신청됨";
}

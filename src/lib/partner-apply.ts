import { digitsOnly, isPhoneNumber } from "@/lib/format";

// 관장 입점 신청 — 입력 제한 (DB check 제약과 같게 유지)
export const APPLY_LIMITS = { gymName: 60, address: 120, ownerName: 30, message: 500 } as const;

export interface PartnerApplyInput {
  gymName: string;
  address: string;
  ownerName: string;
  phone: string;
  message: string;
}

// 검증 + 정리. 문제가 있으면 손님에게 보여줄 문장을 돌려준다.
export function validatePartnerApply(raw: Partial<Record<keyof PartnerApplyInput, unknown>>):
  | { ok: true; value: PartnerApplyInput }
  | { ok: false; error: string } {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const value = {
    gymName: str(raw.gymName),
    address: str(raw.address),
    ownerName: str(raw.ownerName),
    phone: str(raw.phone),
    message: str(raw.message),
  };
  if (!value.gymName) return { ok: false, error: "체육관 이름을 적어주세요" };
  if (value.gymName.length > APPLY_LIMITS.gymName) return { ok: false, error: `체육관 이름은 ${APPLY_LIMITS.gymName}자까지예요` };
  if (value.address.length > APPLY_LIMITS.address) return { ok: false, error: `주소는 ${APPLY_LIMITS.address}자까지예요` };
  if (!value.ownerName) return { ok: false, error: "성함을 적어주세요" };
  if (value.ownerName.length > APPLY_LIMITS.ownerName) return { ok: false, error: `성함은 ${APPLY_LIMITS.ownerName}자까지예요` };
  if (!isPhoneNumber(value.phone)) return { ok: false, error: "연락받으실 전화번호를 확인해주세요" };
  if (value.message.length > APPLY_LIMITS.message) return { ok: false, error: `남기실 말은 ${APPLY_LIMITS.message}자까지예요` };
  return { ok: true, value: { ...value, phone: digitsOnly(value.phone) } };
}

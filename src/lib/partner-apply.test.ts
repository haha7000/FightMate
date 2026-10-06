import { describe, expect, it } from "vitest";
import { validatePartnerApply } from "./partner-apply";

const valid = { gymName: " 그레이시 역삼 ", address: "서울 강남구 테헤란로 1", ownerName: " 김관장 ", phone: "010-1234-5678", message: "" };

describe("관장 입점 신청 검증", () => {
  it("공백 정리 + 전화번호는 숫자만", () => {
    expect(validatePartnerApply(valid)).toEqual({
      ok: true,
      value: { gymName: "그레이시 역삼", address: "서울 강남구 테헤란로 1", ownerName: "김관장", phone: "01012345678", message: "" },
    });
  });

  it("체육관 대표번호(유선)도 받는다", () => {
    expect(validatePartnerApply({ ...valid, phone: "02-123-4567" }).ok).toBe(true);
  });

  it.each([
    ["체육관 이름 없음", { gymName: "  " }, "체육관 이름을 적어주세요"],
    ["체육관 이름 너무 김", { gymName: "가".repeat(61) }, "60자까지"],
    ["주소 너무 김", { address: "가".repeat(121) }, "120자까지"],
    ["성함 없음", { ownerName: "" }, "성함을 적어주세요"],
    ["전화번호 이상", { phone: "전화주세요" }, "전화번호를 확인"],
    ["남길 말 너무 김", { message: "가".repeat(501) }, "500자까지"],
    ["문자열이 아닌 값", { gymName: 123 }, "체육관 이름을 적어주세요"],
  ])("%s → 거절", (_, patch, msg) => {
    const r = validatePartnerApply({ ...valid, ...patch });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(msg);
  });
});

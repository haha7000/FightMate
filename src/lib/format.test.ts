import { describe, expect, it } from "vitest";
import { digitsOnly, formatPhone, formatWon, isMobilePhone, monthDay } from "./format";

describe("formatWon", () => {
  it("0원은 무료", () => expect(formatWon(0)).toBe("무료"));
  it("천 단위 구분", () => expect(formatWon(25000)).toBe("25,000원"));
});

describe("휴대폰 번호", () => {
  it("하이픈·공백 제거", () => expect(digitsOnly("010-1234 5678")).toBe("01012345678"));
  it.each(["010-1234-5678", "01012345678", "011-123-4567"])("%s 는 휴대폰", (p) => expect(isMobilePhone(p)).toBe(true));
  it.each(["02-123-4567", "1588-0000", "010-12-34", ""])("%s 는 아님", (p) => expect(isMobilePhone(p)).toBe(false));
  it("표시 형식", () => {
    expect(formatPhone("01012345678")).toBe("010-1234-5678");
    expect(formatPhone("0111234567")).toBe("011-123-4567");
  });
});

describe("monthDay", () => {
  it("날짜", () => expect(monthDay("2026-10-06")).toBe("10/6"));
  it("ISO 시각도 날짜 부분만", () => expect(monthDay("2026-01-09T23:10:00+09:00")).toBe("1/9"));
});

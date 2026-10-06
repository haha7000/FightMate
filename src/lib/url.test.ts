import { describe, expect, it } from "vitest";
import { safeNextPath } from "./url";

describe("safeNextPath — 로그인 후 이동 경로 (오픈 리다이렉트 차단)", () => {
  it("사이트 내부 경로는 그대로", () => {
    expect(safeNextPath("/gym/abc/apply?type=daypass")).toBe("/gym/abc/apply?type=daypass");
    expect(safeNextPath("/")).toBe("/");
  });

  it.each([
    ["프로토콜 상대 URL", "//evil.com"],
    ["외부 절대 URL", "https://evil.com"],
    ["@ 트릭", "@evil.com"],
    ["빈 값", ""],
    ["없음", null],
    ["undefined", undefined],
  ])("%s → 홈으로", (_, input) => {
    expect(safeNextPath(input)).toBe("/");
  });
});

import { describe, expect, it } from "vitest";
import { scrubAnalyticsUrl } from "./analytics";

const B = "https://fightmate.kr";

describe("방문 통계 주소 다듬기", () => {
  it("초대 토큰·회원 ID·쿼리(로그인 코드)는 지운다", () => {
    expect(scrubAnalyticsUrl(`${B}/invite/abc123secret`)).toBe(`${B}/invite/[token]`);
    expect(scrubAnalyticsUrl(`${B}/fighter/3f2b8c1e-1d2a-4b5c-9d8e-0f1a2b3c4d5e`)).toBe(`${B}/fighter/[id]`);
    expect(scrubAnalyticsUrl(`${B}/?code=oauth-secret&next=/card`)).toBe(`${B}/`);
  });

  it("체육관 상세 같은 손님 화면은 그대로 센다", () => {
    expect(scrubAnalyticsUrl(`${B}/gym/ironfist-gangnam`)).toBe(`${B}/gym/ironfist-gangnam`);
  });

  it("관장·운영자 화면은 세지 않는다", () => {
    expect(scrubAnalyticsUrl(`${B}/partner?gym=g1`)).toBeNull();
    expect(scrubAnalyticsUrl(`${B}/ops`)).toBeNull();
    expect(scrubAnalyticsUrl(`${B}/admin`)).toBeNull();
    expect(scrubAnalyticsUrl(`${B}/opsx`)).toBe(`${B}/opsx`);
  });
});

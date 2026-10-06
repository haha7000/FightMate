import { describe, expect, it } from "vitest";
import { fighterPath, isUserId, rowToProfile } from "./profile";

describe("파이터 프로필", () => {
  it("빈 값은 기본값으로", () => {
    expect(
      rowToProfile({ id: "u", nickname: "철수", discipline: null, weight_class: null, gym_name: null, years: null, belt: null, updated_at: "" })
    ).toEqual({ nickname: "철수", discipline: "주짓수", weightClass: "", gymName: "", years: "", belt: "해당 없음" });
  });

  it("공개 주소는 회원 ID 형식만", () => {
    expect(isUserId("3f2b8c1e-1d2a-4b5c-9d8e-0f1a2b3c4d5e")).toBe(true);
    expect(isUserId("../admin")).toBe(false);
    expect(isUserId("1 or 1=1")).toBe(false);
    expect(fighterPath("abc")).toBe("/fighter/abc");
  });
});

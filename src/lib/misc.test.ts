import { describe, expect, it } from "vitest";
import { toBookingStatus, toBookingType } from "./bookings";
import { publicOrigin } from "./origin";
import { displayName } from "./user";
import { newBookingText } from "./notify.server";

describe("신청 종류·상태 검증", () => {
  it("허용 값은 그대로", () => {
    expect(toBookingType("1일권")).toBe("1일권");
    expect(toBookingStatus("거절")).toBe("거절");
  });
  it("모르는 값은 안전한 기본값", () => {
    expect(toBookingType("정기권")).toBe("체험");
    expect(toBookingStatus("???")).toBe("신청됨");
  });
});

describe("publicOrigin — 프록시 뒤 실제 접속 주소", () => {
  it("Vercel·Tailscale이 넘겨준 주소를 쓴다", () => {
    const req = new Request("http://localhost:3000/auth/callback", {
      headers: { "x-forwarded-host": "fightmate-livid.vercel.app", "x-forwarded-proto": "https" },
    });
    expect(publicOrigin(req)).toBe("https://fightmate-livid.vercel.app");
  });
  it("여러 프록시를 거치면 첫 번째(브라우저 쪽) 값", () => {
    const req = new Request("http://localhost:3000/", {
      headers: { "x-forwarded-host": "a.example.com, b.internal", "x-forwarded-proto": "https, http" },
    });
    expect(publicOrigin(req)).toBe("https://a.example.com");
  });
  it("헤더가 없으면 요청 주소 그대로", () => {
    expect(publicOrigin(new Request("http://localhost:3000/x"))).toBe("http://localhost:3000");
  });
});

describe("displayName — 로그인 제공자별 이름 키", () => {
  it("구글 name, 카카오 nickname 순으로", () => {
    expect(displayName({ name: "홍길동", nickname: "길동" }, "회원")).toBe("홍길동");
    expect(displayName({ nickname: "길동" }, "회원")).toBe("길동");
    expect(displayName({ full_name: 3 }, "회원")).toBe("회원");
    expect(displayName(undefined, "회원")).toBe("회원");
  });
});

describe("관장님 새 신청 문자", () => {
  it("요일 포함, 바로가기 링크", () => {
    const text = newBookingText({
      gymName: "그레이시 주짓수 역삼",
      applicant: "홍길동",
      date: "2026-10-10",
      kind: "체험",
      link: "https://x.app/partner?gym=g1",
    });
    expect(text).toBe("[FightMate] 그레이시 주짓수 역삼 새 체험 신청\n홍길동님 · 10/10(토)\n확인·확정: https://x.app/partner?gym=g1");
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PrivacyPage from "./privacy/page";
import TermsPage from "./terms/page";

afterEach(cleanup);

// 방침은 실제 수집 항목과 맞아야 한다 — 수집 항목을 늘리면 이 테스트가 방침 갱신을 떠올리게 한다
describe("개인정보처리방침", () => {
  it("실제로 받는 항목과 제3자 제공·위치·탈퇴 처리를 모두 적는다", () => {
    render(<PrivacyPage />);
    const text = document.body.textContent!;
    for (const item of ["이름, 연락처, 희망 날짜·시간대, 요청사항", "닉네임, 종목, 체급", "알림을 받을 휴대폰 번호", "쿠키"]) {
      expect(text).toContain(item);
    }
    expect(screen.getByText("4. 제3자 제공")).toBeTruthy();
    expect(text).toContain("저장하지 않으며"); // 위치
    expect(text).toContain("이름·연락처·요청사항은 지웁니다"); // 탈퇴 시 신청 기록
  });
});

describe("이용약관", () => {
  it("중개 서비스임과 운동 중 안전 책임을 밝힌다", () => {
    render(<TermsPage />);
    const text = document.body.textContent!;
    expect(text).toContain("수업을 직접 제공하지 않습니다");
    expect(text).toContain("부상 위험");
    expect(text).toContain("실제로 방문한 회원만");
  });
});

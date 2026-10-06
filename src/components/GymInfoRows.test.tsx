// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MOCK_GYMS } from "@/lib/mock-data";
import type { Gym } from "@/lib/gyms";
import { GymInfoRows, directionsUrl, gearNote } from "./GymInfoRows";

const gym = (over: Partial<Gym> = {}): Gym => ({ ...MOCK_GYMS[0], ...over });
afterEach(cleanup);

describe("체육관 상세 정보 줄", () => {
  it("전화번호는 바로 걸리는 링크, 운영시간은 줄바꿈 그대로", () => {
    render(<GymInfoRows gym={gym({ phone: "02-123-4567", hours: "평일 07:00 – 23:00\n일요일 휴무" })} />);
    expect(screen.getByRole("link", { name: "02-123-4567" }).getAttribute("href")).toBe("tel:02-123-4567");
    expect(screen.getByText(/일요일 휴무/).textContent).toContain("평일 07:00 – 23:00\n일요일 휴무");
  });

  it("입력 안 한 항목은 줄 자체를 숨긴다", () => {
    render(<GymInfoRows gym={gym({ phone: null, hours: null })} />);
    expect(screen.queryByRole("link", { name: /\d{2,3}-/ })).toBeNull();
  });

  it("준비물 안내", () => {
    expect(gearNote(gym({ amenities: ["운동복 대여", "수건 제공"] }))).toContain("몸만 와도");
    expect(gearNote(gym({ amenities: ["운동복 대여"] }))).toContain("수건은 챙겨오세요");
    expect(gearNote(gym({ amenities: [] }))).toBe("운동복과 수건은 챙겨오세요");
  });

  it("길찾기: 좌표가 없으면 주소로 검색", () => {
    expect(directionsUrl(gym({ lat: 37.5, lng: 127 }))).toContain("/link/to/");
    expect(directionsUrl(gym({ lat: null, lng: null }))).toContain("/link/search/");
  });
});

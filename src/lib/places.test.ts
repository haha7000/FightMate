import { describe, expect, it } from "vitest";
import { detectDisciplines, distanceM, formatDistance } from "./places";

describe("detectDisciplines — 카카오 장소 이름에서 종목 추정", () => {
  it("킥복싱은 복싱으로 잡지 않는다", () => {
    expect(detectDisciplines("리더스짐 킥복싱")).toEqual(["킥복싱"]);
  });
  it("복싱과 킥복싱을 둘 다 하면 둘 다", () => {
    expect(detectDisciplines("강남 복싱·킥복싱 클럽").sort()).toEqual(["복싱", "킥복싱"].sort());
  });
  it("영문·대소문자 무관", () => {
    expect(detectDisciplines("Korean Zombie MMA")).toEqual(["MMA"]);
    expect(detectDisciplines("Gracie BJJ")).toEqual(["주짓수"]);
    expect(detectDisciplines("Muay Thai Gym")).toEqual(["무에타이"]);
  });
  it("종목이 없는 이름", () => {
    expect(detectDisciplines("펀짐")).toEqual([]);
  });
});

describe("거리", () => {
  it("강남역 → 역삼역 약 750m", () => {
    const m = distanceM(37.4979, 127.0276, 37.5007, 127.0365);
    expect(m).toBeGreaterThan(700);
    expect(m).toBeLessThan(900);
  });
  it("표시", () => {
    expect(formatDistance(383.4)).toBe("383m");
    expect(formatDistance(1520)).toBe("1.5km");
  });
});

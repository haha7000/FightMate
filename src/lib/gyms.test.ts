import { describe, expect, it } from "vitest";
import type { Tables } from "./database.types";
import { hasReviews, isHandsFree, offersDayPass, rowToGym } from "./gyms";

const row: Tables<"gyms"> = {
  id: "g1",
  name: "테스트 주짓수",
  disciplines: ["주짓수", "요가"], // 요가는 우리 종목이 아님
  district: "강남구 역삼동",
  address: "서울 강남구 테헤란로 1",
  intro: "",
  trial_price: 0,
  day_pass_price: null,
  monthly_price: 180000,
  rating: 4.8,
  review_count: 41,
  emoji: "🥋",
  amenities: ["운동복 대여", "수건 제공", "사우나"], // 사우나는 목록에 없음
  photos: [{ src: "/a.jpg", caption: "매트" }, { src: 3 }, "깨진값", { src: "/b.jpg" }],
  owner_id: null,
  lat: 37.5,
  lng: 127.03,
  kakao_place_id: null,
  phone: null,
  hours: null,
  timetable_url: null,
  is_published: true,
  created_at: "2026-10-01T00:00:00Z",
};

describe("rowToGym — DB 행 변환", () => {
  const gym = rowToGym(row);

  it("허용된 종목·시설만 통과", () => {
    expect(gym.disciplines).toEqual(["주짓수"]);
    expect(gym.amenities).toEqual(["운동복 대여", "수건 제공"]);
  });

  it("사진은 모양이 맞는 것만, 설명 없으면 빈 문자열", () => {
    expect(gym.photos).toEqual([
      { src: "/a.jpg", caption: "매트" },
      { src: "/b.jpg", caption: "" },
    ]);
  });

  it("사진 칸이 배열이 아니면 빈 목록", () => {
    expect(rowToGym({ ...row, photos: null }).photos).toEqual([]);
  });

  it("1일권 null = 미운영", () => {
    expect(gym.dayPassPrice).toBeNull();
    expect(offersDayPass(gym)).toBe(false);
    expect(offersDayPass(rowToGym({ ...row, day_pass_price: 0 }))).toBe(true); // 0원 1일권은 운영(무료)
  });

  it("운동복+수건 제공이면 몸만 와도 OK", () => {
    expect(isHandsFree(gym)).toBe(true);
    expect(isHandsFree(rowToGym({ ...row, amenities: ["운동복 대여"] }))).toBe(false);
  });
});

describe("평점 표시", () => {
  it("리뷰가 0개면 평점 대신 '새로 입점'", () => {
    expect(hasReviews(rowToGym({ ...row, review_count: 0, rating: 0 }))).toBe(false);
    expect(hasReviews(rowToGym({ ...row, review_count: 3, rating: 4.7 }))).toBe(true);
  });
});

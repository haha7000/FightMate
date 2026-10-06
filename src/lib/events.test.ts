import { afterEach, describe, expect, it, vi } from "vitest";
import type { Tables } from "./database.types";
import {
  dateParts,
  eventGiType,
  eventLevel,
  isFull,
  rowToEvent,
  seatsLeft,
  todayKST,
  upcoming,
  weekBucket,
  type GymEvent,
} from "./events";

const ev = (over: Partial<GymEvent> = {}): GymEvent => ({
  id: "e1",
  gymId: "g1",
  gymName: "테스트 체육관",
  kind: "오픈매트",
  title: "토요 오픈매트",
  date: "2026-10-10",
  startTime: "14:00",
  fee: 0,
  capacity: 30,
  attendees: 10,
  description: "",
  posterUrl: null,
  openToVisitors: true,
  ...over,
});

describe("weekBucket — 이벤트 탭 THIS WEEK / NEXT WEEK", () => {
  it("일요일: 이번 주는 오늘 하루, 다음 날(월)부터 다음 주", () => {
    const sun = "2026-10-04";
    expect(weekBucket("2026-10-04", sun)).toBe("this");
    expect(weekBucket("2026-10-05", sun)).toBe("next");
    expect(weekBucket("2026-10-11", sun)).toBe("next");
    expect(weekBucket("2026-10-12", sun)).toBe("later");
  });

  it("수요일: 그 주 일요일까지 이번 주", () => {
    const wed = "2026-10-07";
    expect(weekBucket("2026-10-11", wed)).toBe("this");
    expect(weekBucket("2026-10-12", wed)).toBe("next");
    expect(weekBucket("2026-10-19", wed)).toBe("later");
  });

  it("연말을 넘어가도 주 계산이 맞다", () => {
    expect(weekBucket("2027-01-03", "2026-12-30")).toBe("this"); // 수 → 일
    expect(weekBucket("2027-01-04", "2026-12-30")).toBe("next");
  });
});

describe("dateParts", () => {
  it("요일 (서버 시간대와 무관)", () => {
    expect(dateParts("2026-10-10")).toEqual({ m: 10, d: 10, ko: "토", en: "SAT" });
    expect(dateParts("2026-10-04")).toEqual({ m: 10, d: 4, ko: "일", en: "SUN" });
  });
});

describe("todayKST / upcoming", () => {
  afterEach(() => vi.useRealTimers());

  it("UTC 자정 직전이라도 한국은 다음 날", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T16:30:00Z")); // 한국 10/7 01:30
    expect(todayKST()).toBe("2026-10-07");
  });

  it("지난 일정은 빼고 날짜·시간 순", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-07T03:00:00Z")); // 한국 10/7 12:00
    const list = upcoming([
      ev({ id: "past", date: "2026-10-06" }),
      ev({ id: "late", date: "2026-10-08", startTime: "20:00" }),
      ev({ id: "early", date: "2026-10-08", startTime: "09:00" }),
      ev({ id: "today", date: "2026-10-07" }),
    ]);
    expect(list.map((e) => e.id)).toEqual(["today", "early", "late"]);
  });
});

describe("정원", () => {
  it("남은 자리·마감", () => {
    expect(seatsLeft(ev({ capacity: 30, attendees: 22 }))).toBe(8);
    expect(isFull(ev({ capacity: 24, attendees: 24 }))).toBe(true);
    expect(seatsLeft(ev({ capacity: null }))).toBeNull();
    expect(isFull(ev({ capacity: null, attendees: 999 }))).toBe(false);
  });
});

describe("Gi / No-Gi · 레벨 추정", () => {
  it("노기 표기가 있으면 NO-GI", () => {
    expect(eventGiType(ev({ title: "노기 오픈매트" }), ["주짓수"])).toBe("NO-GI");
    expect(eventGiType(ev({ title: "세미나", kind: "세미나", description: "No-Gi 복장 권장" }))).toBe("NO-GI");
  });
  it("주짓수 체육관 오픈매트는 기본 GI", () => {
    expect(eventGiType(ev(), ["주짓수"])).toBe("GI");
  });
  it("복싱 체육관 일정은 표시 안 함", () => {
    expect(eventGiType(ev({ kind: "특별수업", title: "복싱 입문" }), ["복싱"])).toBeNull();
  });
  it("초보 대상 표시", () => {
    expect(eventLevel(ev({ title: "토요 오픈매트 (초보 환영)" }))).toBe("초보 환영");
    expect(eventLevel(ev({ title: "시합반 스파링" }))).toBeNull();
  });
});

describe("rowToEvent — DB 행 변환", () => {
  const row: Tables<"events"> = {
    id: "e1",
    gym_id: "g1",
    gym_name: "체육관",
    kind: "오픈매트",
    title: "t",
    date: "2026-10-10",
    start_time: "14:00",
    fee: 0,
    capacity: 30,
    attendees: 20,
    rsvp_count: 3,
    description: "",
    poster_url: null,
    open_to_visitors: true,
    created_at: "2026-10-01T00:00:00Z",
  };

  it("표시 인원 = 베이스라인 + 실제 신청", () => expect(rowToEvent(row).attendees).toBe(23));
  it("모르는 종류 값은 '행사'로", () => expect(rowToEvent({ ...row, kind: "이상한값" }).kind).toBe("행사"));
});

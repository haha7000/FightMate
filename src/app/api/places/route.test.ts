import { beforeEach, describe, expect, it, vi } from "vitest";

const searchGymPlaces = vi.fn(async (_opts: unknown) => [] as unknown[]);
vi.mock("@/lib/places.server", () => ({ searchGymPlaces: (o: unknown) => searchGymPlaces(o) }));
const { GET } = await import("./route");

const get = (qs: string, ip = "1.1.1.1") =>
  GET(new Request(`http://localhost:3000/api/places?${qs}`, { headers: { "x-forwarded-for": ip } }));

beforeEach(() => searchGymPlaces.mockClear());

describe("GET /api/places — 지도 주변 체육관 검색", () => {
  it.each([
    ["위도·경도 없음", ""],
    ["경도 없음", "lat=37.5"],
    ["숫자 아님", "lat=abc&lng=127"],
    ["범위 밖", "lat=91&lng=127"],
    ["해외 좌표 (도쿄)", "lat=35.68&lng=139.76"],
    ["(0, 0)", "lat=0&lng=0"],
  ])("%s → 400, 카카오 호출 안 함", async (_, qs) => {
    expect((await get(qs)).status).toBe(400);
    expect(searchGymPlaces).not.toHaveBeenCalled();
  });

  it("허용된 종목만 필터로, 이상한 값은 전체 검색", async () => {
    await get("lat=37.5&lng=127&d=%EC%A3%BC%EC%A7%93%EC%88%98"); // 주짓수
    await get("lat=37.5&lng=127&d=%EC%9A%94%EA%B0%80"); // 요가
    expect(searchGymPlaces.mock.calls.map((c) => (c[0] as { discipline: string | null }).discipline)).toEqual(["주짓수", null]);
  });

  it("반경이 숫자가 아니면 기본 3km", async () => {
    await get("lat=37.5&lng=127&radius=abc");
    expect(searchGymPlaces).toHaveBeenCalledWith(expect.objectContaining({ radius: 3000 }));
  });

  it("검색 실패는 502 (오류 내용은 숨김)", async () => {
    searchGymPlaces.mockRejectedValueOnce(new Error("kakao 401: secret"));
    const res = await get("lat=37.5&lng=127");
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
});

describe("GET /api/places — 남용 방지", () => {
  it("한 IP가 분당 40회를 넘기면 429 + Retry-After, 다른 IP는 영향 없음", async () => {
    for (let i = 0; i < 40; i++) expect((await get("lat=37.5&lng=127", "9.9.9.9")).status).toBe(200);
    const blocked = await get("lat=37.5&lng=127", "9.9.9.9");
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect((await get("lat=37.5&lng=127", "8.8.8.8")).status).toBe(200);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 카카오 키워드 검색 흉내: 검색어별 결과, 페이지 정보
type Doc = { id: string; place_name: string; category_name: string };
function kakaoDoc(d: Doc) {
  return { address_name: "주소", road_address_name: "도로명", phone: "", x: "127.03", y: "37.5", place_url: `https://place/${d.id}`, ...d };
}

let byQuery: Record<string, Doc[]>;
const fetchMock = vi.fn(async (url: string) => {
  const q = new URL(url).searchParams.get("query")!;
  return new Response(JSON.stringify({ documents: (byQuery[q] ?? []).map(kakaoDoc), meta: { is_end: true } }));
});

beforeEach(() => {
  vi.resetModules(); // 모듈 안의 5분 캐시 초기화
  vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockClear();
  byQuery = {};
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const load = async () => (await import("./places.server")).searchGymPlaces;
const at = { lat: 37.4979, lng: 127.0276, radius: 3000 };

describe("searchGymPlaces — 카카오 결과 병합", () => {
  it("여러 검색어에 걸린 같은 장소는 한 번만, 이름에 종목 없으면 걸린 검색어들로 종목 누적", async () => {
    const gym = { id: "p1", place_name: "펀짐", category_name: "스포츠,레저 > 무예 > 격투기" };
    byQuery = { 무에타이: [gym], 킥복싱: [gym] };
    const places = await (await load())({ ...at, discipline: null });
    expect(places).toHaveLength(1);
    expect(places[0].disciplines.sort()).toEqual(["무에타이", "킥복싱"].sort());
  });

  it("이름에 종목이 있으면 이름 기준 (검색어로 덧붙이지 않음)", async () => {
    const gym = { id: "p1", place_name: "리더스 킥복싱", category_name: "스포츠,레저 > 복싱,권투" };
    byQuery = { 복싱: [gym], 킥복싱: [gym] };
    const [p] = await (await load())({ ...at, discipline: null });
    expect(p.disciplines).toEqual(["킥복싱"]);
  });

  it("격투기와 무관한 업종은 제외, 학원 분류라도 이름에 종목 있으면 포함", async () => {
    byQuery = {
      복싱: [
        { id: "shop", place_name: "복싱용품 할인점", category_name: "쇼핑 > 스포츠용품" },
        { id: "gym", place_name: "티비지복싱MMA", category_name: "교육,학문 > 학원" },
        { id: "cafe", place_name: "카페 복싱", category_name: "음식점 > 카페" },
      ],
    };
    const places = await (await load())({ ...at, discipline: "복싱" });
    expect(places.map((p) => p.id)).toEqual(["gym"]);
  });

  it("반경은 100m~20km로 제한해서 요청", async () => {
    await (await load())({ ...at, radius: 999999, discipline: "주짓수" });
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("radius")).toBe("20000");
  });

  it("같은 지역 재검색은 캐시 (카카오 호출 안 함)", async () => {
    const search = await load();
    await search({ ...at, discipline: "주짓수" });
    const n = fetchMock.mock.calls.length;
    await search({ ...at, lat: at.lat + 0.0001, discipline: "주짓수" }); // 약 10m 이동 = 같은 칸
    expect(fetchMock.mock.calls.length).toBe(n);
  });

  it("카카오 오류는 예외로 (빈 결과로 숨기지 않음)", async () => {
    fetchMock.mockImplementationOnce(async () => new Response("bad", { status: 401 }));
    await expect((await load())({ ...at, discipline: "주짓수" })).rejects.toThrow("kakao 401");
  });
});

describe("종목 판단 우선순위", () => {
  it("이름에 종목이 없으면 카카오 분류에서", async () => {
    byQuery = { 주짓수: [{ id: "p1", place_name: "펀짐", category_name: "스포츠,레저 > 무예 > 격투기 > 무에타이" }] };
    const [p] = await (await load())({ ...at, discipline: "주짓수" });
    expect(p.disciplines).toEqual(["무에타이"]);
  });
});

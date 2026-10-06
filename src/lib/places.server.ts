import "server-only";
import { DISCIPLINES, type Discipline } from "@/lib/gyms";
import { MAX_RADIUS_M, detectDisciplines, type Place } from "@/lib/places";

// 카카오 로컬 키워드 검색. REST 키는 서버에만 두고 API Route에서만 호출한다.
const KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const PAGE_SIZE = 15;
const MAX_PAGES = 3; // 카카오 정책상 검색어 1개당 최대 45건

// 같은 지역 반복 검색은 잠깐 캐시 (쿼터 절약). 좌표는 소수 3자리(약 100m)로 묶는다.
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map<string, { at: number; places: Place[] }>();

interface KakaoDoc {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  x: string; // 경도
  y: string; // 위도
  place_url: string;
}

// 격투기와 무관한 분류는 제외 (용품점·식당 등). 이름에 종목이 들어있으면 학원 분류라도 포함.
const EXCLUDED_CATEGORY_PREFIXES = ["쇼핑", "음식점", "가정,생활", "여행"];

function isRelevant(doc: KakaoDoc): boolean {
  if (EXCLUDED_CATEGORY_PREFIXES.some((p) => doc.category_name.startsWith(p))) return false;
  return doc.category_name.startsWith("스포츠,레저") || detectDisciplines(doc.place_name).length > 0;
}

async function searchKeyword(
  apiKey: string,
  query: string,
  lat: number,
  lng: number,
  radius: number
): Promise<KakaoDoc[]> {
  const docs: KakaoDoc[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({
      query,
      x: String(lng),
      y: String(lat),
      radius: String(radius),
      sort: "distance",
      size: String(PAGE_SIZE),
      page: String(page),
    });
    const res = await fetch(`${KAKAO_KEYWORD_URL}?${params}`, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`kakao ${res.status}: ${body.slice(0, 200)}`);
    }
    const body = (await res.json()) as { documents: KakaoDoc[]; meta: { is_end: boolean } };
    docs.push(...body.documents);
    if (body.meta.is_end) break;
  }
  return docs;
}

// 좌표 주변 격투기 체육관 검색. discipline 없으면 전 종목을 병렬로 찾아 합친다.
export async function searchGymPlaces(opts: {
  lat: number;
  lng: number;
  radius: number;
  discipline: Discipline | null;
}): Promise<Place[]> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) throw new Error("KAKAO_REST_API_KEY 미설정");

  const radius = Math.round(Math.min(Math.max(opts.radius, 100), MAX_RADIUS_M));
  const cacheKey = [opts.lat.toFixed(3), opts.lng.toFixed(3), radius, opts.discipline ?? "all"].join("|");
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.places;

  const queries = opts.discipline ? [opts.discipline] : DISCIPLINES;
  const results = await Promise.all(
    queries.map((q) => searchKeyword(apiKey, q, opts.lat, opts.lng, radius))
  );

  const byId = new Map<string, Place>();
  results.forEach((docs, i) => {
    const query = queries[i];
    for (const doc of docs) {
      if (!isRelevant(doc)) continue;
      const existing = byId.get(doc.id);
      if (existing) {
        // 이름에서 종목을 못 찾은 곳은 여러 검색어에 걸릴 때마다 종목을 누적
        if (!existing.disciplines.includes(query) && detectDisciplines(doc.place_name).length === 0) {
          existing.disciplines.push(query);
        }
        continue;
      }
      // 종목 판단 우선순위: 이름 → (이름에 없으면) 카카오 분류 → (그것도 없으면) 찾아낸 검색어.
      // 카카오는 킥복싱 체육관을 "복싱,권투"로 분류하는 경우가 많아, 이름과 분류를 섞으면
      // 킥복싱 체육관이 복싱으로도 분류된다.
      const fromName = detectDisciplines(doc.place_name);
      const detected = fromName.length > 0 ? fromName : detectDisciplines(doc.category_name);
      byId.set(doc.id, {
        id: doc.id,
        name: doc.place_name,
        category: doc.category_name.split(" > ").at(-1) ?? "",
        address: doc.road_address_name || doc.address_name,
        phone: doc.phone,
        lat: Number(doc.y),
        lng: Number(doc.x),
        url: doc.place_url,
        disciplines: detected.length > 0 ? detected : [query], // 예: "슈프림짐"
      });
    }
  });
  const places = [...byId.values()];

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(cacheKey, { at: Date.now(), places });
  return places;
}

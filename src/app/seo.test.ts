import { afterEach, describe, expect, it, vi } from "vitest";
import { MOCK_GYMS } from "@/lib/mock-data";

const getGyms = vi.fn();
const getUpcomingEvents = vi.fn();
vi.mock("@/lib/data.server", () => ({ getGyms: () => getGyms(), getUpcomingEvents: () => getUpcomingEvents() }));
const { default: sitemap } = await import("./sitemap");
const { default: robots } = await import("./robots");
const { default: manifest } = await import("./manifest");

afterEach(() => vi.unstubAllEnvs());

describe("검색 노출 (sitemap·robots) · 앱 설치 (manifest)", () => {
  it("사이트맵: 홈 + 공개 체육관 + 다가오는 일정, 절대 주소", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://fightmate.kr");
    getGyms.mockResolvedValue([MOCK_GYMS[0]]);
    getUpcomingEvents.mockResolvedValue([{ id: "ev1" }]);
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain("https://fightmate.kr");
    expect(urls).toContain(`https://fightmate.kr/gym/${MOCK_GYMS[0].id}`);
    expect(urls).toContain("https://fightmate.kr/event/ev1");
    expect(urls).toContain("https://fightmate.kr/for-gyms"); // 관장님 입점 안내는 검색에 노출
    expect(urls.every((u) => u.startsWith("https://fightmate.kr"))).toBe(true);
  });

  it("사이트맵: DB가 죽어도 기본 페이지는 내보낸다", async () => {
    getGyms.mockRejectedValue(new Error("down"));
    getUpcomingEvents.mockRejectedValue(new Error("down"));
    expect((await sitemap()).length).toBeGreaterThan(0);
  });

  it("robots: 관장·운영자·초대·API·개인 화면은 막고 사이트맵 위치를 알린다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://fightmate.kr");
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.disallow).toEqual(expect.arrayContaining(["/partner", "/ops", "/invite/", "/api/", "/fighter/"]));
    expect(r.sitemap).toBe("https://fightmate.kr/sitemap.xml");
  });

  it("manifest: 홈 화면에 추가하면 앱처럼 (standalone, 브랜드 색, 아이콘)", () => {
    const m = manifest();
    expect(m).toMatchObject({ short_name: "FightMate", display: "standalone", start_url: "/", theme_color: "#0e7a55" });
    expect(m.icons?.map((i) => i.src)).toEqual(["/icon", "/apple-icon"]);
  });
});

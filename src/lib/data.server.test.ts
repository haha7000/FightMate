import { describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "@/test/fake-supabase";
import { MOCK_GYMS } from "./mock-data";

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
const { getFighterProfile, getGymById, getGyms, getUpcomingEvents } = await import("./data.server");

describe("data.server — 실서비스에서 목업으로 조용히 대체하지 않기", () => {
  it("데모 모드(키 없음)에선 목업", async () => {
    createClient.mockResolvedValue(null);
    expect(await getGyms()).toBe(MOCK_GYMS);
  });

  it("DB 조회 실패는 예외 → 에러 화면 (예전엔 가짜 체육관을 보여줬음)", async () => {
    createClient.mockResolvedValue(fakeSupabase({ responses: { "gyms.select": { error: { message: "timeout" } } } }).client);
    await expect(getGyms()).rejects.toThrow("체육관 목록 조회 실패");
    createClient.mockResolvedValue(fakeSupabase({ responses: { "events.select": { error: { message: "timeout" } } } }).client);
    await expect(getUpcomingEvents()).rejects.toThrow("이벤트 목록 조회 실패");
  });

  it("DB가 비어 있으면 빈 목록 (목업 아님)", async () => {
    createClient.mockResolvedValue(fakeSupabase({ responses: { "gyms.select": { data: [] } } }).client);
    expect(await getGyms()).toEqual([]);
  });

  it("없는 체육관은 undefined → 404 (목업에 같은 ID가 있어도)", async () => {
    createClient.mockResolvedValue(fakeSupabase({ responses: { "gyms.select": { data: null } } }).client);
    expect(await getGymById(MOCK_GYMS[0].id)).toBeUndefined();
  });
});

describe("data.server — 숨긴 체육관", () => {
  it("손님 화면 목록은 공개된 곳만, 운영자 화면은 전부", async () => {
    const pub = fakeSupabase({ responses: { "gyms.select": { data: [] } } });
    createClient.mockResolvedValue(pub.client);
    await getGyms();
    expect(pub.calls[0].filters).toContainEqual(["eq", ["is_published", true]]);

    const all = fakeSupabase({ responses: { "gyms.select": { data: [] } } });
    createClient.mockResolvedValue(all.client);
    await getGyms({ includeHidden: true });
    expect(all.calls[0].filters).not.toContainEqual(["eq", ["is_published", true]]);
  });

  it("숨긴 체육관의 일정도 목록에서 뺀다", async () => {
    const sb = fakeSupabase({ responses: { "events.select": { data: [] } } });
    createClient.mockResolvedValue(sb.client);
    await getUpcomingEvents();
    expect(sb.calls[0].args[0]).toContain("gyms!inner(is_published)");
    expect(sb.calls[0].filters).toContainEqual(["eq", ["gyms.is_published", true]]);
  });
});

describe("data.server — 공개 파이터 프로필", () => {
  const uid = "3f2b8c1e-1d2a-4b5c-9d8e-0f1a2b3c4d5e";
  const row = { id: uid, nickname: "철수", discipline: "복싱", weight_class: "-70kg", gym_name: "선릉 복싱", years: "2", belt: null, updated_at: "" };

  it("이상한 주소는 DB를 조회하지 않고 null", async () => {
    createClient.mockClear();
    expect(await getFighterProfile("not-a-uuid")).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("닉네임이 있어야 공개", async () => {
    createClient.mockResolvedValue(fakeSupabase({ responses: { "profiles.select": { data: row } } }).client);
    expect(await getFighterProfile(uid)).toMatchObject({ nickname: "철수", discipline: "복싱", belt: "해당 없음" });
    createClient.mockResolvedValue(fakeSupabase({ responses: { "profiles.select": { data: { ...row, nickname: "  " } } } }).client);
    expect(await getFighterProfile(uid)).toBeNull();
  });
});

import { describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "@/test/fake-supabase";
import { MOCK_GYMS } from "./mock-data";

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
const { getGymById, getGyms, getUpcomingEvents } = await import("./data.server");

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

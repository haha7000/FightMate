import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "@/test/fake-supabase";
import type { Gym } from "./gyms";

let sb = fakeSupabase({});
vi.mock("@/lib/supabase/client", () => ({ createClient: () => sb.client }));
const p = await import("./partner.client");

afterEach(() => vi.unstubAllGlobals());

const bookingRow = (over = {}) => ({
  id: "b1", name: "홍길동", phone: "010", date: "2026-10-10", type: "체험", status: "신청됨",
  created_at: "2026-10-06T01:00:00Z", status_changed_at: null, ...over,
});

describe("관장 모드 — 신청 관리", () => {
  it("체육관 신청을 최신순으로, DB 값은 검증해서", async () => {
    sb = fakeSupabase({ responses: { "bookings.select": { data: [bookingRow({ type: "이상한값", status: "거절", status_changed_at: "2026-10-06T02:00:00Z" })] } } });
    const [b] = await p.fetchGymBookings("g1");
    expect(b).toMatchObject({ id: "b1", type: "체험", status: "거절", statusChangedAt: "2026-10-06T02:00:00Z" });
    expect(sb.calls[0].filters).toEqual([
      ["eq", ["gym_id", "g1"]],
      ["order", ["created_at", { ascending: false }]],
    ]);
  });

  it("조회 실패는 화면에 보일 수 있게 예외로", async () => {
    sb = fakeSupabase({ responses: { "bookings.select": { error: { message: "권한 없음" } } } });
    await expect(p.fetchGymBookings("g1")).rejects.toThrow("권한 없음");
  });

  it("상태 변경은 해당 신청 하나만", async () => {
    sb = fakeSupabase({});
    await p.setBookingStatus("b1", "거절");
    expect(sb.calls[0]).toMatchObject({ table: "bookings", op: "update", args: [{ status: "거절" }], filters: [["eq", ["id", "b1"]]] });
  });
});

describe("관장 모드 — 체육관 정보 저장", () => {
  const gym = { id: "g1", name: "그레이시", intro: "소개", disciplines: ["주짓수"], trialPrice: 0, dayPassPrice: null, monthlyPrice: 180000, amenities: ["샤워실"], photos: [{ src: "/a.jpg", caption: "" }] } as unknown as Gym;

  it("화면 값을 DB 컬럼으로 (1일권 미운영은 null 그대로)", async () => {
    sb = fakeSupabase({});
    await p.saveGym(gym);
    expect(sb.calls[0].args[0]).toEqual({
      name: "그레이시", intro: "소개", disciplines: ["주짓수"], trial_price: 0, day_pass_price: null,
      monthly_price: 180000, amenities: ["샤워실"], photos: [{ src: "/a.jpg", caption: "" }],
      phone: null, hours: null, timetable_url: null,
    });
    expect(sb.calls[0].filters).toEqual([["eq", ["id", "g1"]]]);
  });

  it("연락처·운영시간은 앞뒤 공백을 지우고, 비우면 null", async () => {
    sb = fakeSupabase({});
    await p.saveGym({ ...gym, phone: " 02-123-4567 ", hours: "  평일 07–23시\n", timetableUrl: "/t.jpg" });
    expect(sb.calls[0].args[0]).toMatchObject({ phone: "02-123-4567", hours: "평일 07–23시", timetable_url: "/t.jpg" });
    sb = fakeSupabase({});
    await p.saveGym({ ...gym, phone: "   ", hours: "" });
    expect(sb.calls[0].args[0]).toMatchObject({ phone: null, hours: null });
  });
});

describe("관장 모드 — 알림 번호", () => {
  it("저장할 땐 숫자만", async () => {
    sb = fakeSupabase({});
    await p.saveNotify("g1", { phone: "010-1111-2222", enabled: true });
    expect(sb.calls[0]).toMatchObject({ op: "upsert", args: [expect.objectContaining({ gym_id: "g1", phone: "01011112222", enabled: true })] });
  });

  it("테스트 문자 실패 이유를 그대로 보여준다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "알림 번호를 먼저 등록해주세요" }), { status: 404 })));
    await expect(p.sendNotifyTest("g1")).rejects.toThrow("알림 번호를 먼저 등록해주세요");
  });
});

describe("운영자 — 초대·입점 요청", () => {
  it("초대 링크는 만든 운영자를 기록하고 토큰을 돌려준다", async () => {
    sb = fakeSupabase({ user: { id: "admin1" }, responses: { "gym_invites.insert": { data: { token: "abc123" } } } });
    expect(await p.createInvite("g1", "owner")).toBe("abc123");
    expect(sb.calls[0].args[0]).toEqual({ gym_id: "g1", role: "owner", created_by: "admin1" });
  });

  it.each([
    ["invite_used", "이미 사용된 초대 링크예요"],
    ["invite_expired", "기간이 지난 초대 링크예요"],
    ["invalid_invite", "유효하지 않은 초대 링크예요"],
  ])("초대 수락 오류 %s → 한국어 안내", async (code, message) => {
    sb = fakeSupabase({ rpc: { redeem_gym_invite: { error: { message: `P0001: ${code}` } } } });
    await expect(p.redeemInvite("t")).rejects.toThrow(message);
  });

  it("입점 요청은 같은 장소끼리 묶어 요청 수가 많은 순", async () => {
    const r = (id: string, name: string) => ({ kakao_place_id: id, name, address: "", phone: "", created_at: "2026-10-06" });
    sb = fakeSupabase({ responses: { "gym_requests.select": { data: [r("1", "A"), r("2", "B"), r("2", "B"), r("2", "B"), r("1", "A")] } } });
    const list = await p.fetchGymRequests();
    expect(list.map((x) => [x.name, x.count])).toEqual([
      ["B", 3],
      ["A", 2],
    ]);
  });

  it("체육관별 관장 수", async () => {
    sb = fakeSupabase({ responses: { "gym_members.select": { data: [{ gym_id: "g1" }, { gym_id: "g1" }, { gym_id: "g2" }] } } });
    expect(await p.fetchMemberCounts()).toEqual({ g1: 2, g2: 1 });
  });
});

describe("내 역할 (내 카드 탭 입구)", () => {
  it("비로그인이면 역할 없음", async () => {
    sb = fakeSupabase({ user: null });
    expect(await p.fetchMyRoles()).toEqual({ isAdmin: false, gymCount: 0 });
  });
  it("운영자·관장 체육관 수", async () => {
    sb = fakeSupabase({ user: { id: "u1" }, responses: { "admins.select": { data: { user_id: "u1" } }, "gym_members.select": { data: [{ gym_id: "g1" }] } } });
    expect(await p.fetchMyRoles()).toEqual({ isAdmin: true, gymCount: 1 });
  });
});

describe("운영자 — 숨기기·관장 연결·초대 관리", () => {
  it("체육관 숨기기·다시 공개", async () => {
    sb = fakeSupabase({});
    await p.setGymPublished("g1", false);
    expect(sb.calls[0]).toMatchObject({ table: "gyms", op: "update", args: [{ is_published: false }], filters: [["eq", ["id", "g1"]]] });
  });

  it("관장 목록에 닉네임을 붙인다 (프로필 없으면 null)", async () => {
    sb = fakeSupabase({
      responses: {
        "gym_members.select": { data: [
          { user_id: "u1", role: "owner", created_at: "2026-10-01T00:00:00Z" },
          { user_id: "u2", role: "coach", created_at: "2026-10-02T00:00:00Z" },
        ] },
        "profiles.select": { data: [{ id: "u1", nickname: "김관장" }] },
      },
    });
    expect(await p.fetchGymMembers("g1")).toEqual([
      { userId: "u1", role: "owner", nickname: "김관장", since: "2026-10-01T00:00:00Z" },
      { userId: "u2", role: "coach", nickname: null, since: "2026-10-02T00:00:00Z" },
    ]);
    expect(sb.calls[1].filters).toEqual([["in", ["id", ["u1", "u2"]]]]);
  });

  it("관장이 없으면 프로필은 조회하지 않는다", async () => {
    sb = fakeSupabase({ responses: { "gym_members.select": { data: [] } } });
    expect(await p.fetchGymMembers("g1")).toEqual([]);
    expect(sb.calls).toHaveLength(1);
  });

  it("연결 해제는 그 체육관의 그 회원만", async () => {
    sb = fakeSupabase({});
    await p.removeGymMember("g1", "u1");
    expect(sb.calls[0]).toMatchObject({ table: "gym_members", op: "delete", filters: [["eq", ["gym_id", "g1"]], ["eq", ["user_id", "u1"]]] });
  });

  it("초대 목록은 안 쓰고 기간 남은 것만", async () => {
    sb = fakeSupabase({ responses: { "gym_invites.select": { data: [{ token: "t1", role: "owner", expires_at: "2026-10-20T00:00:00Z" }] } } });
    const now = new Date("2026-10-06T00:00:00Z");
    expect(await p.fetchPendingInvites("g1", now)).toEqual([{ token: "t1", role: "owner", expiresAt: "2026-10-20T00:00:00Z" }]);
    expect(sb.calls[0].filters).toEqual(expect.arrayContaining([
      ["eq", ["gym_id", "g1"]],
      ["is", ["used_at", null]],
      ["gte", ["expires_at", now.toISOString()]],
    ]));
  });

  it("초대 취소 실패는 예외로", async () => {
    sb = fakeSupabase({ responses: { "gym_invites.delete": { error: { message: "권한 없음" } } } });
    await expect(p.revokeInvite("t1")).rejects.toThrow("권한 없음");
  });
});

describe("운영자 — 예약 지표", () => {
  it("개인정보 없이 집계에 필요한 칸만 가져온다", async () => {
    sb = fakeSupabase({ responses: { "bookings.select": { data: [
      { gym_id: "g1", gym_name: "그레이시", status: "신청됨", type: "체험", created_at: "2026-10-05T00:00:00Z" },
    ] } } });
    const s = await p.fetchBookingStats(new Date("2026-10-06T00:00:00Z"));
    expect(sb.calls[0].args[0]).toBe("gym_id, gym_name, status, type, created_at");
    expect(s).toMatchObject({ active: 1, last7: 1 });
  });
});

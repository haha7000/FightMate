import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, jsonRequest } from "@/test/fake-supabase";

// ── 의존성 가짜로 바꾸기 ──
const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
vi.mock("@/lib/data.server", () => ({ getGymById: async () => ({ name: "그레이시 주짓수 역삼" }) }));
const sendSms = vi.fn(async (to: string, text: string) => ({ ok: true, to, text }));
vi.mock("@/lib/notify.server", async (orig) => ({
  ...(await orig<object>()),
  sendSms: (to: string, text: string) => sendSms(to, text),
}));
// after(): 응답 뒤 작업 — 테스트에선 바로 실행하고 끝날 때까지 기다린다
const afterTasks: Promise<unknown>[] = [];
vi.mock("next/server", async (orig) => ({
  ...(await orig<object>()),
  after: (fn: () => unknown) => afterTasks.push(Promise.resolve(fn())),
}));

const { POST } = await import("./route");

const URL_ = "http://localhost:3000/api/inquiries";
const valid = { gymId: "gracie-yeoksam", name: "  홍길동 ", phone: " 010-1234-5678 ", date: "2099-10-10", agreed: true };
const settle = () => Promise.all(afterTasks.splice(0));

beforeEach(() => {
  sendSms.mockClear();
  vi.unstubAllEnvs();
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/inquiries — 체험·1일권 신청", () => {
  it("필수값이 없으면 400", async () => {
    const res = await POST(jsonRequest(URL_, { ...valid, name: "  " }));
    expect(res.status).toBe(400);
  });

  it("JSON이 깨졌으면 400", async () => {
    const res = await POST(new Request(URL_, { method: "POST", body: "{깨짐" }));
    expect(res.status).toBe(400);
  });

  it("로그인 안 했으면 401, DB에 아무것도 넣지 않음", async () => {
    const sb = fakeSupabase({ user: null });
    createClient.mockResolvedValue(sb.client);
    const res = await POST(jsonRequest(URL_, valid));
    expect(res.status).toBe(401);
    expect(sb.calls.find((c) => c.op === "insert")).toBeUndefined();
  });

  it("로그인 회원 명의로, 공백 정리해서 저장", async () => {
    const sb = fakeSupabase({ user: { id: "u1" }, responses: { "bookings.insert": { data: { id: "b1" } } } });
    createClient.mockResolvedValue(sb.client);
    const res = await POST(jsonRequest(URL_, { ...valid, type: "1일권" }));
    expect(res.status).toBe(200);
    const insert = sb.calls.find((c) => c.table === "bookings" && c.op === "insert")!;
    expect(insert.args[0]).toMatchObject({
      user_id: "u1",
      gym_id: "gracie-yeoksam",
      gym_name: "그레이시 주짓수 역삼",
      name: "홍길동",
      phone: "010-1234-5678",
      type: "1일권",
    });
    await settle();
  });

  it("알 수 없는 종류는 체험으로 저장", async () => {
    const sb = fakeSupabase({ user: { id: "u1" }, responses: { "bookings.insert": { data: { id: "b1" } } } });
    createClient.mockResolvedValue(sb.client);
    await POST(jsonRequest(URL_, { ...valid, type: "정기권" }));
    expect(sb.calls.find((c) => c.op === "insert")!.args[0]).toMatchObject({ type: "체험" });
    await settle();
  });

  it("관장님께 문자: 방금 신청 ID로 대상 조회, 실제 접속 주소로 관장 모드 링크", async () => {
    const sb = fakeSupabase({
      user: { id: "u1" },
      responses: { "bookings.insert": { data: { id: "b1" } } },
      rpc: {
        booking_notify_targets: {
          data: [
            { phone: "01011112222", gym_id: "g1", gym_name: "그레이시", applicant: "홍길동", visit_date: "2099-10-10", kind: "체험" },
          ],
        },
      },
    });
    createClient.mockResolvedValue(sb.client);
    await POST(jsonRequest(URL_, valid, { headers: { "x-forwarded-host": "fightmate.example", "x-forwarded-proto": "https" } }));
    await settle();

    expect(sb.rpcCalls).toEqual([{ fn: "booking_notify_targets", args: { bid: "b1" } }]);
    expect(sendSms).toHaveBeenCalledTimes(1);
    const [to, text] = sendSms.mock.calls[0];
    expect(to).toBe("01011112222");
    expect(text).toContain("https://fightmate.example/partner?gym=g1");
    expect(text).toContain("10/10(토)"); // 2099-10-10은 토요일
  });

  it("운영자 번호가 있으면 함께 보내고, 관장 번호가 없으면 직접 연락 필요라고 알림", async () => {
    vi.stubEnv("OPS_NOTIFY_PHONE", "01099998888");
    const sb = fakeSupabase({ user: { id: "u1" }, responses: { "bookings.insert": { data: { id: "b1" } } }, rpc: { booking_notify_targets: { data: [] } } });
    createClient.mockResolvedValue(sb.client);
    await POST(jsonRequest(URL_, valid));
    await settle();
    expect(sendSms).toHaveBeenCalledTimes(1);
    const [to, text] = sendSms.mock.calls[0];
    expect(to).toBe("01099998888");
    expect(text).toContain("직접 연락 필요");
  });

  it("저장 실패면 500, 알림도 보내지 않음", async () => {
    const sb = fakeSupabase({ user: { id: "u1" }, responses: { "bookings.insert": { error: { message: "rls" } } } });
    createClient.mockResolvedValue(sb.client);
    const res = await POST(jsonRequest(URL_, valid));
    expect(res.status).toBe(500);
    expect(sb.rpcCalls).toEqual([]);
    expect(afterTasks).toHaveLength(0);
  });

  it("개인정보 제공 동의가 없으면 400 (화면 체크박스를 우회해도)", async () => {
    const sb = fakeSupabase({ user: { id: "u1" } });
    createClient.mockResolvedValue(sb.client);
    const res = await POST(jsonRequest(URL_, { ...valid, agreed: undefined }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("동의");
    expect(sb.calls).toHaveLength(0);
  });

  it.each([
    ["지난 날짜", "2020-01-01"],
    ["형식이 이상한 날짜", "내일"],
  ])("%s는 400", async (_, date) => {
    createClient.mockResolvedValue(fakeSupabase({ user: { id: "u1" } }).client);
    expect((await POST(jsonRequest(URL_, { ...valid, date }))).status).toBe(400);
  });

  it("요청사항이 300자를 넘으면 400", async () => {
    createClient.mockResolvedValue(fakeSupabase({ user: { id: "u1" } }).client);
    expect((await POST(jsonRequest(URL_, { ...valid, note: "가".repeat(301) }))).status).toBe(400);
  });

  it("희망 시간대·요청사항 저장, 이상한 시간대는 '상관없음'", async () => {
    const sb = fakeSupabase({ user: { id: "u1" }, responses: { "bookings.insert": { data: { id: "b1" } } } });
    createClient.mockResolvedValue(sb.client);
    await POST(jsonRequest(URL_, { ...valid, preferredTime: "저녁", note: "  복싱 6개월  " }));
    await POST(jsonRequest(URL_, { ...valid, preferredTime: "새벽3시", note: "   " }));
    const inserts = sb.calls.filter((c) => c.op === "insert").map((c) => c.args[0]);
    expect(inserts[0]).toMatchObject({ preferred_time: "저녁", note: "복싱 6개월" });
    expect(inserts[1]).toMatchObject({ preferred_time: "상관없음", note: null });
    await settle();
  });

  it("같은 날짜로 이미 신청했으면 409와 안내 문구", async () => {
    createClient.mockResolvedValue(
      fakeSupabase({ user: { id: "u1" }, responses: { "bookings.insert": { error: { message: "dup", code: "23505" } } } }).client
    );
    const res = await POST(jsonRequest(URL_, valid));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain("이미 같은 날짜로 신청했어요");
  });
});

import { describe, expect, it, vi } from "vitest";
import { fakeSupabase, jsonRequest } from "@/test/fake-supabase";

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
const { POST, DELETE } = await import("./route");

const URL_ = "http://localhost:3000/api/events/ev1/rsvp";
const ctx = { params: Promise.resolve({ id: "ev1" }) };
const me = { user: { id: "u1" } };

describe("POST /api/events/[id]/rsvp — 이벤트 참가 신청", () => {
  it("로그인 필요", async () => {
    createClient.mockResolvedValue(fakeSupabase({ user: null }).client);
    expect((await POST(jsonRequest(URL_, {}), ctx)).status).toBe(401);
  });

  it("없는 이벤트는 404", async () => {
    createClient.mockResolvedValue(fakeSupabase({ ...me, responses: { "events.select": { data: null } } }).client);
    expect((await POST(jsonRequest(URL_, {}), ctx)).status).toBe(404);
  });

  it("정원(베이스라인 + 실제 신청)이 차면 409, 저장하지 않음", async () => {
    const sb = fakeSupabase({
      ...me,
      responses: { "events.select": { data: { attendees: 20, rsvp_count: 10, capacity: 30 } } },
    });
    createClient.mockResolvedValue(sb.client);
    expect((await POST(jsonRequest(URL_, { name: "홍길동" }), ctx)).status).toBe(409);
    expect(sb.calls.find((c) => c.op === "insert")).toBeUndefined();
  });

  it("정원 무제한이면 인원과 상관없이 신청", async () => {
    const sb = fakeSupabase({ ...me, responses: { "events.select": { data: { attendees: 999, rsvp_count: 999, capacity: null } } } });
    createClient.mockResolvedValue(sb.client);
    expect((await POST(jsonRequest(URL_, { name: "홍길동" }), ctx)).status).toBe(200);
  });

  it("이미 신청했으면 다시 저장하지 않고 성공 처리 (멱등)", async () => {
    const sb = fakeSupabase({
      ...me,
      responses: {
        "events.select": { data: { attendees: 0, rsvp_count: 0, capacity: 30 } },
        "event_rsvps.select": { data: { id: "r1" } },
      },
    });
    createClient.mockResolvedValue(sb.client);
    const res = await POST(jsonRequest(URL_, {}), ctx);
    expect(await res.json()).toMatchObject({ ok: true, already: true });
    expect(sb.calls.find((c) => c.op === "insert")).toBeUndefined();
  });

  it("동시에 두 번 눌러 중복 키 충돌(23505)이 나도 성공 처리", async () => {
    const sb = fakeSupabase({
      ...me,
      responses: {
        "events.select": { data: { attendees: 0, rsvp_count: 0, capacity: 30 } },
        "event_rsvps.insert": { error: { message: "duplicate", code: "23505" } },
      },
    });
    createClient.mockResolvedValue(sb.client);
    const res = await POST(jsonRequest(URL_, {}), ctx);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ already: true });
  });

  it("본인 명의로 이름·연락처 공백 정리해 저장", async () => {
    const sb = fakeSupabase({ ...me, responses: { "events.select": { data: { attendees: 0, rsvp_count: 0, capacity: 30 } } } });
    createClient.mockResolvedValue(sb.client);
    await POST(jsonRequest(URL_, { name: " 홍길동 ", phone: " 010 " }), ctx);
    expect(sb.calls.find((c) => c.op === "insert")!.args[0]).toEqual({ event_id: "ev1", user_id: "u1", name: "홍길동", phone: "010" });
  });
});

describe("DELETE /api/events/[id]/rsvp — 신청 취소", () => {
  it("본인 신청만 지운다 (이벤트·사용자 조건 둘 다)", async () => {
    const sb = fakeSupabase(me);
    createClient.mockResolvedValue(sb.client);
    const res = await DELETE(new Request(URL_, { method: "DELETE" }), ctx);
    expect(res.status).toBe(200);
    const del = sb.calls.find((c) => c.op === "delete")!;
    expect(del.filters).toEqual([
      ["eq", ["event_id", "ev1"]],
      ["eq", ["user_id", "u1"]],
    ]);
  });
});

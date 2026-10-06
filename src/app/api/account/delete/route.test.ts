import { describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "@/test/fake-supabase";

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
const { POST } = await import("./route");

describe("POST /api/account/delete — 회원 탈퇴", () => {
  it("로그인 필요, DB 함수 호출 안 함", async () => {
    const sb = fakeSupabase({ user: null });
    createClient.mockResolvedValue(sb.client);
    expect((await POST()).status).toBe(401);
    expect(sb.rpcCalls).toHaveLength(0);
  });

  it("본인 계정 삭제 함수를 부르고 로그인 쿠키도 정리", async () => {
    const sb = fakeSupabase({ user: { id: "u1" } });
    createClient.mockResolvedValue(sb.client);
    expect((await POST()).status).toBe(200);
    expect(sb.rpcCalls).toEqual([{ fn: "delete_my_account", args: undefined }]);
    expect(sb.wasSignedOut()).toBe(true);
  });

  it("삭제가 실패하면 500, 로그아웃도 하지 않는다 (계정이 남아 있으니)", async () => {
    const sb = fakeSupabase({ user: { id: "u1" }, rpc: { delete_my_account: { error: { message: "permission denied" } } } });
    createClient.mockResolvedValue(sb.client);
    const res = await POST();
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("permission denied"); // 내부 오류는 숨김
    expect(sb.wasSignedOut()).toBe(false);
  });
});

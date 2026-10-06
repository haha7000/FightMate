import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn(async () => ({}));
vi.mock("solapi", () => ({
  SolapiMessageService: class {
    constructor(public key: string, public secret: string) {}
    send = send;
  },
}));

// 키는 모듈을 읽을 때 정해지므로 환경변수를 바꾼 뒤 새로 불러온다
async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import("./notify.server");
}

beforeEach(() => send.mockClear());
afterEach(() => vi.unstubAllEnvs());

describe("sendSms — 솔라피 문자 발송", () => {
  it("키가 없으면 실제로 보내지 않고 실패로 알린다", async () => {
    const { sendSms, smsConfigured } = await load({ SOLAPI_API_KEY: "", SOLAPI_API_SECRET: "", SOLAPI_SENDER: "" });
    expect(smsConfigured).toBe(false);
    expect(await sendSms("010-1111-2222", "hi")).toMatchObject({ ok: false });
    expect(send).not.toHaveBeenCalled();
  });

  it("번호는 숫자만 남겨 보낸다", async () => {
    const { sendSms } = await load({ SOLAPI_API_KEY: "k", SOLAPI_API_SECRET: "s", SOLAPI_SENDER: "010-9999-8888" });
    expect(await sendSms("010-1111-2222", "안녕하세요")).toEqual({ ok: true });
    expect(send).toHaveBeenCalledWith({ to: "01011112222", from: "01099998888", text: "안녕하세요" });
  });

  it("발송 오류는 예외 대신 실패 결과로 (신청 처리를 막지 않게)", async () => {
    send.mockRejectedValueOnce(new Error("잔액 부족"));
    const { sendSms } = await load({ SOLAPI_API_KEY: "k", SOLAPI_API_SECRET: "s", SOLAPI_SENDER: "01099998888" });
    expect(await sendSms("01011112222", "x")).toEqual({ ok: false, error: "잔액 부족" });
  });
});

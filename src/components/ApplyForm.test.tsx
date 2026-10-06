// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MOCK_GYMS } from "@/lib/mock-data";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
const { default: ApplyForm } = await import("./ApplyForm");

const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("홍길동"), "홍길동");
  await user.type(screen.getByPlaceholderText("010-0000-0000"), "01012345678");
  // date 입력은 브라우저마다 달라 값을 직접 넣는다
  const date = document.querySelector('input[type="date"]') as HTMLInputElement;
  await user.type(date, "2099-10-10");
}

describe("체험 신청 폼", () => {
  it("개인정보 제공에 동의하기 전엔 신청 버튼이 꺼져 있다", async () => {
    const user = userEvent.setup();
    render(<ApplyForm gym={MOCK_GYMS[0]} kind="체험" />);
    await fill(user);
    const submit = screen.getByRole("button", { name: "체험 신청하기" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    await user.click(screen.getByRole("checkbox"));
    expect(submit.disabled).toBe(false);
  });

  it("시간대·요청사항·동의를 함께 보낸다", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    const user = userEvent.setup();
    render(<ApplyForm gym={MOCK_GYMS[0]} kind="1일권" />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "저녁" }));
    await user.type(screen.getByPlaceholderText(/운동 경력/), "복싱 6개월");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "1일권 신청하기" }));

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toMatchObject({ type: "1일권", preferredTime: "저녁", note: "복싱 6개월", agreed: true });
    expect(await screen.findByText("1일권 신청 완료")).toBeTruthy();
  });

  it("서버가 알려준 이유를 보여준다 (예: 중복 신청)", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "이미 같은 날짜로 신청했어요. 내 예약에서 확인해주세요." }), { status: 409 })
    );
    const user = userEvent.setup();
    render(<ApplyForm gym={MOCK_GYMS[0]} kind="체험" />);
    await fill(user);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "체험 신청하기" }));
    expect(await screen.findByText("이미 같은 날짜로 신청했어요. 내 예약에서 확인해주세요.")).toBeTruthy();
  });

  it("요청사항 글자 수 표시 (300자 제한)", async () => {
    const user = userEvent.setup();
    render(<ApplyForm gym={MOCK_GYMS[0]} kind="체험" />);
    await user.type(screen.getByPlaceholderText(/운동 경력/), "안녕하세요");
    expect(screen.getByText("5/300")).toBeTruthy();
  });
});

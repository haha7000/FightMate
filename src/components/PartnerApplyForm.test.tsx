// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PartnerApplyForm from "./PartnerApplyForm";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/그레이시 주짓수 역삼/), "선릉 복싱");
  await user.type(screen.getByPlaceholderText("홍길동 관장"), "김관장");
  await user.type(screen.getByPlaceholderText("010-0000-0000"), "010-1111-2222");
}

describe("관장 입점 신청 폼", () => {
  it("동의해야 보낼 수 있고, 보내면 완료 안내", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<PartnerApplyForm />);
    await fill(user);
    const submit = screen.getByRole("button", { name: "입점 신청하기" });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("checkbox"));
    await user.click(submit);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/partner-applications");
    expect(JSON.parse(init.body as string)).toMatchObject({ gymName: "선릉 복싱", ownerName: "김관장", phone: "010-1111-2222", agreed: true });
    expect(await screen.findByText("입점 신청을 받았어요")).toBeTruthy();
  });

  it("서버가 알려준 이유를 보여주고 입력은 유지", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "연락받으실 전화번호를 확인해주세요" }), { status: 400 })));
    const user = userEvent.setup();
    render(<PartnerApplyForm />);
    await fill(user);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "입점 신청하기" }));
    expect(await screen.findByText("연락받으실 전화번호를 확인해주세요")).toBeTruthy();
    expect(screen.getByDisplayValue("선릉 복싱")).toBeTruthy();
  });
});

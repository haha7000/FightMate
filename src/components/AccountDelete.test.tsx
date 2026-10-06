// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountDelete from "./AccountDelete";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("회원 탈퇴", () => {
  it("확인 시트에서 무엇이 지워지는지 알리고, 취소하면 아무것도 안 함", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<AccountDelete />);
    await user.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    const sheet = screen.getByRole("dialog");
    expect(within(sheet).getByText(/되돌릴 수 없어요/)).toBeTruthy();
    expect(within(sheet).getByText(/이름과\s*연락처는 지워져요/)).toBeTruthy();
    await user.click(within(sheet).getByRole("button", { name: "취소" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("실패하면 시트를 닫고 이유를 보여준다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "탈퇴를 처리하지 못했어요" }), { status: 500 })));
    const user = userEvent.setup();
    render(<AccountDelete />);
    await user.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "탈퇴하기" }));
    expect(await screen.findByText("탈퇴를 처리하지 못했어요")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

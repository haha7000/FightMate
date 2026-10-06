// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MOCK_GYMS } from "@/lib/mock-data";
import type { Gym } from "@/lib/gyms";
import GymList from "./GymList";

afterEach(cleanup);

const gyms: Gym[] = [
  { ...MOCK_GYMS[0], id: "a", name: "역삼 주짓수", district: "강남구 역삼동", disciplines: ["주짓수"] },
  { ...MOCK_GYMS[0], id: "b", name: "대치 복싱", district: "강남구 대치동", disciplines: ["복싱"] },
  { ...MOCK_GYMS[0], id: "c", name: "양재 MMA", district: "서초구 양재동", disciplines: ["MMA"] },
];
const names = () => screen.queryAllByRole("heading", { level: 3 }).map((h) => h.textContent);

describe("홈 체육관 목록 — 검색·지역", () => {
  it("검색어를 치면 바로 걸러지고, X로 지우면 전부", async () => {
    const user = userEvent.setup();
    render(<GymList gyms={gyms} events={[]} />);
    await user.type(screen.getByRole("searchbox", { name: "체육관 검색" }), "양재");
    expect(names()).toEqual(["양재 MMA"]);
    await user.click(screen.getByRole("button", { name: "검색어 지우기" }));
    expect(names()).toHaveLength(3);
  });

  it("지역 칩은 체육관이 있는 구만, 누르면 그 구만", async () => {
    const user = userEvent.setup();
    render(<GymList gyms={gyms} events={[]} />);
    const group = screen.getByRole("group", { name: "지역" });
    expect(within(group).getAllByRole("button").map((b) => b.textContent)).toEqual(["모든 지역", "강남구", "서초구"]);
    await user.click(within(group).getByRole("button", { name: "강남구" }));
    expect(names()).toEqual(["역삼 주짓수", "대치 복싱"]);
    await user.click(within(group).getByRole("button", { name: "강남구" })); // 다시 누르면 해제
    expect(names()).toHaveLength(3);
  });

  it("지역이 한 곳뿐이면 지역 칩을 숨긴다", () => {
    render(<GymList gyms={gyms.slice(0, 2)} events={[]} />);
    expect(screen.queryByRole("group", { name: "지역" })).toBeNull();
  });

  it("결과가 없으면 안내 + 조건 초기화", async () => {
    const user = userEvent.setup();
    render(<GymList gyms={gyms} events={[]} />);
    await user.type(screen.getByRole("searchbox", { name: "체육관 검색" }), "없는체육관");
    expect(screen.getByText(/"없는체육관"에 맞는 체육관이 없어요/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "조건 초기화" }));
    expect(names()).toHaveLength(3);
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("");
  });
});

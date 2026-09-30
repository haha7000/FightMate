import type { Metadata } from "next";
import GymMap from "@/components/GymMap";
import { getGyms } from "@/lib/data.server";

export const metadata: Metadata = {
  title: "내 주변 격투기 체육관 지도 — FightMate",
  description: "지도에서 내 주변 주짓수·복싱·MMA·무에타이 체육관을 찾고, 전화 없이 체험을 예약하세요.",
};

export default async function MapPage() {
  const gyms = await getGyms();
  return <GymMap gyms={gyms} />;
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ApplyForm from "@/components/ApplyForm";
import { offersDayPass } from "@/lib/gyms";
import { getGymById } from "@/lib/data.server";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export const metadata: Metadata = { robots: { index: false } };

// 체험(기본) 또는 1일권(?type=daypass) 신청. DB 체육관도 동작하도록 서버에서 조회.
export default async function ApplyPage({ params, searchParams }: Props) {
  const [{ id }, { type }] = await Promise.all([params, searchParams]);
  const gym = await getGymById(id);
  if (!gym) notFound();
  const kind = type === "daypass" && offersDayPass(gym) ? "1일권" : "체험";
  return <ApplyForm gym={gym} kind={kind} />;
}

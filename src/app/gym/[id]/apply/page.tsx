import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import ApplyForm from "@/components/ApplyForm";
import { offersDayPass } from "@/lib/gyms";
import { getGymById } from "@/lib/data.server";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export const metadata: Metadata = { robots: { index: false } };

// 체험(기본) 또는 1일권(?type=daypass) 신청. 로그인한 회원만 — 비로그인이면 로그인 후 이 화면으로 복귀.
export default async function ApplyPage({ params, searchParams }: Props) {
  const [{ id }, { type }] = await Promise.all([params, searchParams]);

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const back = `/gym/${id}/apply${type === "daypass" ? "?type=daypass" : ""}`;
      redirect(`/login?next=${encodeURIComponent(back)}`);
    }
  }

  const gym = await getGymById(id);
  if (!gym) notFound();
  const kind = type === "daypass" && offersDayPass(gym) ? "1일권" : "체험";
  return <ApplyForm gym={gym} kind={kind} />;
}

import Link from "next/link";
import type { Metadata } from "next";
import InviteAccept from "@/components/InviteAccept";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "관장 초대 — FightMate", robots: { index: false } };

interface Props {
  params: Promise<{ token: string }>;
}

// 운영자가 보낸 초대 링크. 로그인하면 해당 체육관 관장(코치)으로 연결된다.
export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.rpc("peek_gym_invite", { invite_token: token })
    : { data: null };
  const invite = data?.[0];
  const viewer = await getViewer();
  const alreadyMember = !!invite && !!viewer?.memberships.some((m) => m.gym.id === invite.gym_id);

  return (
    <main className="grain flex min-h-dvh flex-col bg-night px-6 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-white">
      <p className="font-num text-[15px] tracking-[0.18em]">
        FIGHT<span className="text-brand-bright">MATE</span>
      </p>

      <div className="flex flex-1 flex-col justify-center">
        {!invite ? (
          <Message title="유효하지 않은 초대 링크예요" body="링크가 정확한지 확인하거나, FightMate에 새 링크를 요청해주세요." />
        ) : alreadyMember ? (
          <Message title="이미 연결된 체육관이에요" body={`${invite.gym_name} 관장 모드로 바로 들어가세요.`} />
        ) : invite.expired ? (
          <Message title="기간이 지난 초대 링크예요" body="FightMate에 새 링크를 요청해주세요." />
        ) : invite.used ? (
          <Message title="이미 사용된 초대 링크예요" body="다른 분이 이 링크로 연결했어요. 새 링크를 요청해주세요." />
        ) : (
          <>
            <p className="font-num text-[12px] tracking-[0.24em] text-brand-bright">PARTNER INVITE</p>
            <h1 className="mt-3 font-display text-[36px] leading-[1.1]">{invite.gym_name}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-white/70">
              {invite.role === "coach" ? "코치" : "관장"}으로 초대받으셨어요.
              <br />
              연결하면 들어온 체험 신청을 확인하고, 일정과 사진을 직접 관리할 수 있어요.
            </p>
          </>
        )}
      </div>

      {invite && alreadyMember && (
        <Link href={`/partner?gym=${invite.gym_id}`} className="rounded-xl bg-brand-bright py-3.5 text-center text-[16px] font-bold text-night">
          관장 모드 열기
        </Link>
      )}
      {invite && !alreadyMember && !invite.expired && !invite.used &&
        (viewer ? (
          <InviteAccept token={token} />
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
            className="rounded-xl bg-brand-bright py-3.5 text-center text-[16px] font-bold text-night"
          >
            로그인하고 연결하기
          </Link>
        ))}
    </main>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h1 className="font-display text-[30px] leading-[1.15]">{title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-white/70">{body}</p>
    </>
  );
}

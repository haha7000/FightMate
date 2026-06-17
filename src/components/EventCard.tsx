import Link from "next/link";
import {
  eventKindEmoji,
  eventKindStyle,
  formatEventDate,
  formatFee,
  type GymEvent,
} from "@/lib/events";

// 이벤트 카드. showGym=true면 체육관명도 표시(홈 피드용).
export default function EventCard({
  event,
  showGym = false,
}: {
  event: GymEvent;
  showGym?: boolean;
}) {
  return (
    <Link
      href={`/event/${event.id}`}
      className="block rounded-2xl border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700 active:bg-neutral-800"
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${eventKindStyle(
            event.kind
          )}`}
        >
          {eventKindEmoji(event.kind)} {event.kind}
        </span>
        {event.openToVisitors && (
          <span className="rounded-md bg-neutral-800 px-1.5 py-0.5 text-[11px] text-neutral-300">
            방문 환영
          </span>
        )}
        <span className="ml-auto text-sm font-bold text-neutral-200">
          {formatEventDate(event.date)}
        </span>
      </div>

      <h3 className="mt-2 font-semibold leading-snug">{event.title}</h3>

      {showGym && (
        <p className="mt-0.5 text-xs text-neutral-400">{event.gymName}</p>
      )}

      <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
        <span>🕐 {event.startTime}</span>
        <span>·</span>
        <span className={event.fee === 0 ? "text-red-400" : ""}>
          {formatFee(event.fee)}
        </span>
        {event.capacity && (
          <>
            <span>·</span>
            <span>정원 {event.capacity}명</span>
          </>
        )}
      </div>
    </Link>
  );
}

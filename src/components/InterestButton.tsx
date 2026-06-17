"use client";

import { useEffect, useState } from "react";

// 가벼운 "관심있어요" 토글 (localStorage). RSVP는 다음 단계.
// TODO(M2): Supabase event_interests 테이블 + 정원/마감 처리
export default function InterestButton({ eventId }: { eventId: string }) {
  const [interested, setInterested] = useState(false);

  const key = `fm_interest_${eventId}`;

  useEffect(() => {
    setInterested(window.localStorage.getItem(key) === "1");
  }, [key]);

  function toggle() {
    const next = !interested;
    setInterested(next);
    if (next) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  }

  return (
    <button
      onClick={toggle}
      className={`w-full rounded-xl py-3.5 text-center font-bold transition-colors ${
        interested
          ? "bg-neutral-800 text-red-400"
          : "bg-red-600 text-white active:bg-red-700"
      }`}
    >
      {interested ? "❤️ 관심 등록됨" : "🤍 관심있어요"}
    </button>
  );
}

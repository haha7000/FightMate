"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, IdCard, Map, Ticket } from "lucide-react";

const TABS = [
  { href: "/", label: "홈", Icon: House },
  { href: "/map", label: "지도", Icon: Map },
  { href: "/events", label: "이벤트", Icon: CalendarDays },
  { href: "/bookings", label: "내 예약", Icon: Ticket },
  { href: "/card", label: "내 카드", Icon: IdCard },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// 하단 탭바 — 앱 폭(480px) 안에 고정, 아이폰 홈 바 영역만큼 여백
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="grid h-14 grid-cols-5">
        {TABS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium ${
                active ? "text-brand" : "text-muted"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.3 : 1.7} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`text-[15px] font-black tracking-tight ${className}`}>
      fight<span className="text-brand">mate</span>
    </span>
  );
}

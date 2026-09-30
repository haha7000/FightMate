"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/map", label: "지도", icon: "🗺️" },
  { href: "/bookings", label: "내 예약", icon: "🎟️" },
  { href: "/card", label: "내 카드", icon: "🃏" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-neutral-50/95 backdrop-blur md:hidden">
      <div className="mx-auto flex h-14 max-w-md">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
                active ? "text-orange-600" : "text-neutral-400"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  return (
    <header className="hidden border-b border-neutral-200 md:block">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="text-sm font-bold tracking-widest text-orange-600">
          FIGHTMATE
        </Link>
        <nav className="flex items-center gap-6">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`text-sm font-medium ${
                isActive(pathname, tab.href)
                  ? "text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {tab.label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-600">{user.name}님</span>
              <button
                onClick={signOut}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-500 hover:border-neutral-300"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:border-neutral-300"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

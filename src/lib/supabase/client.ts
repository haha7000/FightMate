"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

// 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
// 키가 없으면 null을 반환 → 호출부에서 목데이터 폴백.
export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

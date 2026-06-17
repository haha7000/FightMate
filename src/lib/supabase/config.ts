// Supabase 환경변수가 모두 설정되어 있는지 여부.
// 키가 없으면 앱은 목데이터로 폴백한다 (개발/데모 단계).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// 카카오·구글 로그인 메타데이터에서 표시 이름 고르기 (제공자마다 키가 다름)
export function displayName(meta: Record<string, unknown> | undefined, fallback: string): string {
  const pick = (k: string) => (typeof meta?.[k] === "string" ? (meta[k] as string) : "");
  return pick("name") || pick("full_name") || pick("nickname") || fallback;
}

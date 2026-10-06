// 약관·개인정보처리방침에 들어가는 운영자 정보. 사업자등록 후 여기만 채우면 된다.
// ⚠️ 출시 전 변호사 등 전문가 검토 필요 — 검토가 끝나면 LEGAL_DRAFT를 false로.
export const LEGAL = {
  serviceName: "FightMate",
  operator: "[운영자 이름 또는 상호 — 사업자등록 후 기입]",
  privacyOfficer: "[개인정보 보호책임자 이름]",
  contactEmail: "[문의 이메일]",
  effectiveDate: "[시행일 — 출시일]",
} as const;

export const LEGAL_DRAFT = true;

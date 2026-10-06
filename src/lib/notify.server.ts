import "server-only";
import { SolapiMessageService } from "solapi";

// 문자 발송 (솔라피). 키가 없으면 실제로 보내지 않고 로그만 남긴다 — 개발 중 안전장치.
// 나중에 카카오 알림톡으로 바꿀 때도 이 파일만 고치면 된다 (솔라피가 알림톡도 지원).

const API_KEY = process.env.SOLAPI_API_KEY;
const API_SECRET = process.env.SOLAPI_API_SECRET;
const SENDER = process.env.SOLAPI_SENDER; // 솔라피에 등록·인증한 발신번호

export const smsConfigured = Boolean(API_KEY && API_SECRET && SENDER);

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

// 휴대폰 번호 형식 확인 (010으로 시작하는 10~11자리)
export function isMobile(phone: string): boolean {
  return /^01[016789]\d{7,8}$/.test(normalizePhone(phone));
}

export async function sendSms(to: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const phone = normalizePhone(to);
  if (!smsConfigured) {
    console.log("[sms:not-configured]", { to: phone.replace(/\d{4}$/, "****"), text });
    return { ok: false, error: "문자 발송 키가 설정되지 않았어요" };
  }
  try {
    // 글자 수에 따라 SMS(단문)/LMS(장문) 자동 구분
    await new SolapiMessageService(API_KEY!, API_SECRET!).send({ to: phone, from: normalizePhone(SENDER!), text });
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("[sms:failed]", phone.replace(/\d{4}$/, "****"), error);
    return { ok: false, error };
  }
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

// 관장님께 가는 새 신청 문자
export function newBookingText(p: {
  gymName: string;
  applicant: string;
  date: string; // YYYY-MM-DD
  kind: string;
  link: string;
}): string {
  const [y, m, d] = p.date.split("-").map(Number);
  const dow = DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `[FightMate] ${p.gymName} 새 ${p.kind} 신청\n${p.applicant}님 · ${m}/${d}(${dow})\n확인·확정: ${p.link}`;
}

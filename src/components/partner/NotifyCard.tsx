"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing } from "lucide-react";
import { fetchNotify, saveNotify, sendNotifyTest, type NotifySetting } from "@/lib/partner.client";

const formatPhone = (p: string) => p.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
const isMobile = (p: string) => /^01[016789]\d{7,8}$/.test(p.replace(/\D/g, ""));

// 새 신청 문자 알림 설정: 번호 등록 · 켜고 끄기 · 테스트 문자
export default function NotifyCard({ gymId }: { gymId: string }) {
  const [setting, setSetting] = useState<NotifySetting | null | undefined>(undefined); // undefined = 불러오는 중
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetchNotify(gymId)
      .then((s) => {
        setSetting(s);
        if (!s) setEditing(true);
      })
      .catch(() => setSetting(null)); // 테이블이 아직 없으면 등록 화면만
  }, [gymId]);

  async function save(next: NotifySetting) {
    setBusy(true);
    setMessage(null);
    try {
      await saveNotify(gymId, next);
      setSetting({ ...next, phone: next.phone.replace(/\D/g, "") });
      setEditing(false);
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "저장하지 못했어요" });
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage(null);
    try {
      await sendNotifyTest(gymId);
      setMessage({ ok: true, text: "테스트 문자를 보냈어요. 1분 안에 도착해요." });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "보내지 못했어요" });
    } finally {
      setBusy(false);
    }
  }

  if (setting === undefined) return null;

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isMobile(phone)) return setMessage({ ok: false, text: "휴대폰 번호를 확인해주세요 (010으로 시작)" });
            save({ phone, enabled: true });
          }}
        >
          <p className="flex items-center gap-1.5 text-[15px] font-bold">
            <BellRing size={18} className="text-brand" /> 새 신청을 문자로 받아보세요
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            체험·1일권 신청이 들어오면 이 번호로 바로 알려드려요. 문자에 있는 링크로 확정까지 한 번에.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              className="input flex-1"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button type="submit" disabled={busy} className="shrink-0 rounded-xl bg-brand px-4 text-[15px] font-bold text-white disabled:opacity-50">
              등록
            </button>
          </div>
          {setting && (
            <button type="button" onClick={() => setEditing(false)} className="mt-2 text-[13px] text-muted">
              취소
            </button>
          )}
        </form>
      ) : (
        setting && (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-1.5 text-[14px]">
                {setting.enabled ? (
                  <BellRing size={18} className="shrink-0 text-brand" />
                ) : (
                  <BellOff size={18} className="shrink-0 text-muted" />
                )}
                <span className="truncate">
                  새 신청 알림 <b className="tabular-nums">{formatPhone(setting.phone)}</b>
                </span>
              </p>
              <label className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold">
                {setting.enabled ? "켜짐" : "꺼짐"}
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[var(--color-brand)]"
                  checked={setting.enabled}
                  disabled={busy}
                  onChange={(e) => save({ ...setting, enabled: e.target.checked })}
                />
              </label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[13px] font-semibold">
              <button
                onClick={() => {
                  setPhone(formatPhone(setting.phone));
                  setEditing(true);
                  setMessage(null);
                }}
                className="rounded-lg bg-field py-2"
              >
                번호 변경
              </button>
              <button onClick={test} disabled={busy || !setting.enabled} className="rounded-lg bg-field py-2 disabled:opacity-50">
                테스트 문자 보내기
              </button>
            </div>
          </>
        )
      )}
      {message && <p className={`mt-2 text-[12px] ${message.ok ? "text-brand" : "text-red-600"}`}>{message.text}</p>}
    </div>
  );
}

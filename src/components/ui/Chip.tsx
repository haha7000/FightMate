// 선택 칩(필터·토글). 화면 성격에 따라 세 가지 톤.
//  light    : 일반 밝은 화면
//  floating : 지도 위에 떠 있는 칩 (그림자)
//  dark     : 검은 포스터 화면
type Tone = "light" | "floating" | "dark";

const STYLES: Record<Tone, { base: string; on: string; off: string }> = {
  light: {
    base: "rounded-lg border",
    on: "border-transparent bg-ink text-white",
    off: "border-line bg-white text-ink",
  },
  floating: {
    base: "rounded-lg shadow-md",
    on: "bg-ink text-white",
    off: "bg-white text-ink",
  },
  dark: {
    base: "border",
    on: "border-transparent bg-brand-bright text-night",
    off: "border-white/20 text-white/75",
  },
};

export function Chip({
  active,
  onClick,
  tone = "light",
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone?: Tone;
  children: React.ReactNode;
}) {
  const s = STYLES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1 px-3 py-1.5 text-[13px] font-semibold ${s.base} ${active ? s.on : s.off}`}
    >
      {children}
    </button>
  );
}

// 앱 아이콘 그림 (next/og ImageResponse용 — 일반 CSS 클래스 대신 인라인 스타일만 쓴다)
export function AppIconMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0e7a55",
        color: "white",
        fontSize: size * 0.56,
        fontWeight: 900,
        letterSpacing: -size * 0.03,
        fontFamily: "sans-serif",
      }}
    >
      FM
    </div>
  );
}

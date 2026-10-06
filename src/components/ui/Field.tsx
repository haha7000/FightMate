// 라벨 + 입력칸 묶음. 라벨을 눌러도 입력칸에 포커스가 간다(label로 감쌈).
export function Field({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean; // 2열 그리드처럼 좁은 곳
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={`${compact ? "text-[13px]" : "text-[14px]"} font-semibold`}>{label}</span>
      {children}
    </label>
  );
}

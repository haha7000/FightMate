import { TabBar } from "@/components/nav";

export default function TabsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <div className="pb-[calc(3.5rem+env(safe-area-inset-bottom))]">{children}</div>
      <TabBar />
    </>
  );
}

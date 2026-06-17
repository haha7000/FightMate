import { TabBar, TopNav } from "@/components/nav";

export default function TabsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <TopNav />
      <div className="pb-20 md:pb-0">{children}</div>
      <TabBar />
    </>
  );
}

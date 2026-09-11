import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Sidebar />
      <main className="flex-1 min-w-0 bg-canvas pb-16 lg:pb-0">{children}</main>
    </>
  );
}

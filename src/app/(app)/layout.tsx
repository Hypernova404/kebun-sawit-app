import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { getSessionUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  if (!user) redirect("/masuk");

  return (
    <>
      <Sidebar />
      <main className="flex-1 min-w-0 bg-canvas pb-16 lg:pb-0">{children}</main>
    </>
  );
}

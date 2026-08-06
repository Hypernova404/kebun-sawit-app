import { redirect } from "next/navigation";
import { GoogleButton } from "./google-button";
import { getSessionUser } from "@/lib/session";

export default async function MasukPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight">SawitDesk</h1>
          <p className="text-sm text-muted-foreground">
            Manajemen kebun kelapa sawit - masuk untuk mulai mencatat data kebunmu.
          </p>
        </div>
        <div className="mt-8">
          <GoogleButton />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Data tersimpan aman per akun - setiap pengguna punya kebun sendiri.
        </p>
        <p className="mt-4 text-center text-xs font-medium text-muted-foreground/80">
          Project by Kelompok 4
        </p>
      </div>
    </div>
  );
}

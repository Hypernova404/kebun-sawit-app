"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"

export function KeluarButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false)

  return (
    <button
      onClick={async () => {
        setBusy(true)
        await authClient.signOut()
        window.location.href = "/masuk"
      }}
      disabled={busy}
      className={className ?? "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-muted disabled:opacity-60"}
    >
      <LogOut data-icon />
      {busy ? "Keluar…" : "Keluar"}
    </button>
  )
}

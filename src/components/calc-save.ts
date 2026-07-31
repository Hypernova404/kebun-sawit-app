"use client"

import { toast } from "sonner"
import { simpanRiwayat } from "@/lib/actions"

export async function saveHistory(
  jenisMenu: string,
  dataInput: unknown,
  dataHasil: unknown,
  blokId?: string | null,
  blokKode?: string | null
) {
  const res = await simpanRiwayat(jenisMenu, dataInput, dataHasil, blokId ?? null)
  if (res.error) {
    toast.error("Gagal menyimpan riwayat", { description: String(res.error.message ?? res.error) })
  } else if (jenisMenu === "pengiriman_tbs" || jenisMenu === "kebutuhan_pupuk") {
    toast.success("Data transaksi tersimpan", { description: blokKode ? `Blok ${blokKode}` : undefined })
  }
  return res
}

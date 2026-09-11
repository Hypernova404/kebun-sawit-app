"use server"

import { revalidatePath } from "next/cache"
import { getDb } from "./db"
import { generatePDF } from "./pdf"
import { getLocalUserId } from "./session"

async function requireUserId(): Promise<string> {
  return getLocalUserId()
}

export async function simpanRiwayat(jenisMenu: string, dataInput: unknown, dataHasil: unknown, blokId?: string | null) {
  const userId = await requireUserId()
  if (blokId) {
    const blok = await getDb().blok.findFirst({ where: { id: blokId } })
    if (!blok) return { error: { code: "NOT_FOUND", message: "blok_id tidak ditemukan" } }
  }
  const serializedInput = JSON.stringify(dataInput)
  const duplikat = await getDb().riwayatKalkulasi.findFirst({
    where: { jenisMenu, dataInput: serializedInput, blokId: blokId ?? null },
    select: { id: true },
    orderBy: { tanggal: "desc" },
  })
  if (duplikat) return { id: duplikat.id, duplikat: true }
  const entry = await getDb().riwayatKalkulasi.create({
    data: {
      userId,
      jenisMenu,
      dataInput: serializedInput,
      dataHasil: JSON.stringify(dataHasil),
      blokId: blokId ?? null,
    },
  })
  revalidatePath("/")
  return { id: entry.id, duplikat: false }
}

export async function getRiwayat(filterKategori?: string | null, filterBlok?: string | null) {
  const blokKode = filterBlok?.trim().toUpperCase()
  const riwayats = await getDb().riwayatKalkulasi.findMany({
    where: {
      jenisMenu: filterKategori || undefined,
      blok: blokKode ? { kode: { contains: blokKode } } : undefined,
    },
    include: { blok: { select: { kode: true } } },
    orderBy: { tanggal: "desc" },
    take: 200,
  })
  return riwayats.map((r) => ({
    id: r.id,
    jenis_menu: r.jenisMenu,
    tanggal: r.tanggal,
    data_input: JSON.parse(r.dataInput) as unknown,
    data_hasil: JSON.parse(r.dataHasil) as unknown,
    blok_kode: r.blok?.kode ?? null,
  }))
}

export async function hapusRiwayat(id: string) {
  const entry = await getDb().riwayatKalkulasi.findFirst({ where: { id } })
  if (!entry) return { error: "Entri tidak ditemukan" }
  await getDb().riwayatKalkulasi.delete({ where: { id } })
  revalidatePath("/")
  return { ok: true }
}

export async function hapusRiwayatBanyak(ids: string[]) {
  if (!ids.length) return { error: "Tidak ada riwayat yang dihapus" }
  const result = await getDb().riwayatKalkulasi.deleteMany({
    where: { id: { in: ids } },
  })
  revalidatePath("/")
  return { ok: true, dihapus: result.count }
}

export async function downloadPDF(entryIds: string[]) {
  if (!entryIds.length) return { error: "Pilih minimal 1 entri" }
  const rows = await getDb().riwayatKalkulasi.findMany({
    where: { id: { in: entryIds } },
    include: { blok: { select: { kode: true } } },
    orderBy: { tanggal: "desc" },
  })
  if (!rows.length) return { error: "Entri tidak ditemukan" }
  const items = []
  for (const r of rows) {
    const entry = {
      id: r.id,
      jenis_menu: r.jenisMenu,
      tanggal: r.tanggal,
      data_input: JSON.parse(r.dataInput) as unknown,
      data_hasil: JSON.parse(r.dataHasil) as unknown,
      blok_kode: r.blok?.kode ?? null,
    }
    const bytes = await generatePDF([entry])
    items.push({ id: r.id, buffer: Buffer.from(bytes).toString("base64") })
  }
  return { items }
}
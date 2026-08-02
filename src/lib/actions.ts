"use server"

import { revalidatePath } from "next/cache"
import { getDb } from "./db"
import { hitungStatusBlok } from "./engine/populasi"
import { generatePDF } from "./pdf"
import { getSessionUser } from "./session"

async function requireUserId(): Promise<string> {
  const user = await getSessionUser()
  if (!user) throw new Error("Silakan masuk terlebih dahulu")
  return user.id
}

export type StrukturKebun = {
  id: string
  nama: string
  lokasi: string | null
  wilayah: string
  afdelingen: {
    id: string
    kode: string
    nama: string | null
    luasHa: number
    bloks: {
      id: string
      kode: string
      luasHa: number
      tahunTanam: number
      jumlahPokok: number
      varietas: string | null
      jenisLahan: string
      status: string
      umur: number
    }[]
  }[]
}

export async function getStrukturKebun(): Promise<StrukturKebun[]> {
  const userId = await requireUserId()
  const kebuns = await getDb().kebun.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      afdelingen: {
        orderBy: { kode: "asc" },
        include: {
          bloks: { orderBy: { kode: "asc" } },
        },
      },
    },
  })
  const tahun = new Date().getFullYear()
  return kebuns.map((k) => ({
    ...k,
    afdelingen: k.afdelingen.map((a) => ({
      ...a,
      bloks: a.bloks.map((b) => {
        const s = hitungStatusBlok(b.tahunTanam, tahun).data ?? { umur: 0, status: "TBM" }
        return { ...b, status: s.status, umur: s.umur }
      }),
    })),
  }))
}

export async function tambahKebun(nama: string, lokasi: string, wilayah: string) {
  if (!nama.trim()) return { error: "Nama kebun wajib diisi" }
  const userId = await requireUserId()
  await getDb().kebun.create({ data: { userId, nama: nama.trim(), lokasi: lokasi.trim() || null, wilayah } })
  revalidatePath("/")
}

export async function tambahAfdeling(kebunId: string, kode: string, nama: string, luasHa: number) {
  if (!kebunId || !kode.trim()) return { error: "Kebun dan kode afdeling wajib diisi" }
  if (luasHa <= 0) return { error: "Luas afdeling harus > 0" }
  const userId = await requireUserId()
  const kebun = await getDb().kebun.findFirst({ where: { id: kebunId, userId } })
  if (!kebun) return { error: "Kebun tidak ditemukan" }
  await getDb().afdeling.create({ data: { kebunId, kode: kode.trim().toUpperCase(), nama: nama.trim() || null, luasHa } })
  revalidatePath("/")
}

export type InputBlok = {
  afdelingId: string
  kode: string
  luasHa: number
  tahunTanam: number
  jumlahPokok: number
  varietas?: string
  jenisLahan: string
}

export async function tambahBlok(input: InputBlok) {
  const tahun = new Date().getFullYear()
  if (!input.afdelingId || !input.kode.trim()) return { error: "Afdeling dan kode blok wajib diisi" }
  if (input.luasHa <= 0) return { error: "Luas blok harus > 0" }
  if (input.tahunTanam > tahun) return { error: "tahun_tanam tidak boleh di masa depan" }
  const userId = await requireUserId()
  const afdeling = await getDb().afdeling.findFirst({
    where: { id: input.afdelingId, kebun: { userId } },
  })
  if (!afdeling) return { error: "Afdeling tidak ditemukan" }
  const exist = await getDb().blok.findFirst({
    where: { kebunId: afdeling.kebunId, kode: input.kode.trim().toUpperCase() },
  })
  if (exist) return { error: `Kode blok ${input.kode} sudah dipakai` }
  await getDb().blok.create({
    data: {
      afdelingId: input.afdelingId,
      kebunId: afdeling.kebunId,
      kode: input.kode.trim().toUpperCase(),
      luasHa: input.luasHa,
      tahunTanam: input.tahunTanam,
      jumlahPokok: input.jumlahPokok,
      varietas: input.varietas || null,
      jenisLahan: input.jenisLahan,
    },
  })
  revalidatePath("/")
}

export async function updateBlok(id: string, input: Partial<InputBlok>) {
  if (input.tahunTanam != null && input.tahunTanam > new Date().getFullYear())
    return { error: "tahun_tanam tidak boleh di masa depan" }
  const userId = await requireUserId()
  const blok = await getDb().blok.findFirst({ where: { id, kebun: { userId } } })
  if (!blok) return { error: "Blok tidak ditemukan" }
  await getDb().blok.update({
    where: { id },
    data: {
      luasHa: input.luasHa ?? undefined,
      tahunTanam: input.tahunTanam ?? undefined,
      jumlahPokok: input.jumlahPokok ?? undefined,
      varietas: input.varietas ?? undefined,
      jenisLahan: input.jenisLahan ?? undefined,
      dosisOverride: undefined,
    },
  })
  revalidatePath("/")
}

export async function hapusBlok(id: string) {
  const userId = await requireUserId()
  const blok = await getDb().blok.findFirst({ where: { id, kebun: { userId } } })
  if (!blok) return { error: "Blok tidak ditemukan" }
  await getDb().blok.delete({ where: { id } })
  revalidatePath("/")
}

export async function simpanDosisOverride(blokId: string, dosisOverride: Record<string, number>) {
  const userId = await requireUserId()
  const blok = await getDb().blok.findFirst({ where: { id: blokId, kebun: { userId } } })
  if (!blok) return { error: "Blok tidak ditemukan" }
  await getDb().blok.update({ where: { id: blokId }, data: { dosisOverride: JSON.stringify(dosisOverride) } })
  revalidatePath("/")
}

export async function simpanRiwayat(jenisMenu: string, dataInput: unknown, dataHasil: unknown, blokId?: string | null) {
  const userId = await requireUserId()
  if (blokId) {
    const blok = await getDb().blok.findFirst({ where: { id: blokId, kebun: { userId } } })
    if (!blok) return { error: { code: "NOT_FOUND", message: "blok_id tidak ditemukan" } }
  }
  const entry = await getDb().riwayatKalkulasi.create({
    data: {
      userId,
      jenisMenu,
      dataInput: JSON.stringify(dataInput),
      dataHasil: JSON.stringify(dataHasil),
      blokId: blokId ?? null,
    },
  })
  revalidatePath("/")
  return { id: entry.id }
}

export async function getRiwayat(filterKategori?: string | null, filterBlok?: string | null) {
  const userId = await requireUserId()
  const blokKode = filterBlok?.trim().toUpperCase()
  const riwayats = await getDb().riwayatKalkulasi.findMany({
    where: {
      userId,
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

export async function getDetailBlok(blokId: string) {
  const userId = await requireUserId()
  const blok = await getDb().blok.findFirst({
    where: { id: blokId, kebun: { userId } },
    include: { afdeling: { include: { kebun: true } } },
  })
  if (!blok) return null
  const tahun = new Date().getFullYear()
  const status = hitungStatusBlok(blok.tahunTanam, tahun).data!
  const riwayat = await getDb().riwayatKalkulasi.findMany({
    where: { userId, blokId },
    orderBy: { tanggal: "desc" },
    take: 20,
  })
  const pupukTerakhir = riwayat.find((r) => r.jenisMenu === "kebutuhan_pupuk")
  const bulanIni = new Date()
  const bulanAwal = new Date(bulanIni.getFullYear(), bulanIni.getMonth(), 1)
  const panenBulanIni = riwayat.filter(
    (r) => r.jenisMenu === "pengiriman_tbs" && r.tanggal >= bulanAwal
  )
  return {
    info_dasar: {
      id: blok.id,
      kode: blok.kode,
      luas_ha: blok.luasHa,
      tahun_tanam: blok.tahunTanam,
      jumlah_pokok: blok.jumlahPokok,
      varietas: blok.varietas,
      jenis_lahan: blok.jenisLahan,
      afdeling: blok.afdeling.kode,
      kebun: blok.afdeling.kebun.nama,
      dosis_override: blok.dosisOverride ? (JSON.parse(blok.dosisOverride) as Record<string, number>) : null,
    },
    status,
    riwayat_pupuk_terakhir: pupukTerakhir
      ? { tanggal: pupukTerakhir.tanggal, data_hasil: JSON.parse(pupukTerakhir.dataHasil) }
      : null,
    riwayat_panen_bulan_ini: panenBulanIni.map((p) => ({
      tanggal: p.tanggal,
      data_input: JSON.parse(p.dataInput),
      data_hasil: JSON.parse(p.dataHasil),
    })),
  }
}

export async function getDashboard() {
  const userId = await requireUserId()
  const bloks = await getDb().blok.findMany({
    where: { kebun: { userId } },
    select: { luasHa: true },
  })
  const totalLuas = bloks.reduce((s, b) => s + b.luasHa, 0)

  const sekarang = new Date()
  const bulanAwal = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)

  const panen = await getDb().riwayatKalkulasi.findMany({
    where: { userId, jenisMenu: "pengiriman_tbs", tanggal: { gte: bulanAwal } },
    orderBy: { tanggal: "asc" },
  })
  const pupuk = await getDb().riwayatKalkulasi.findMany({
    where: { userId, jenisMenu: "kebutuhan_pupuk", tanggal: { gte: bulanAwal } },
  })

  let totalProduksi = 0
  let totalPendapatan = 0
  for (const p of panen) {
    const input = JSON.parse(p.dataInput) as { tonase?: number }
    const hasil = JSON.parse(p.dataHasil) as { pendapatan?: number }
    totalProduksi += input.tonase ?? 0
    totalPendapatan += hasil.pendapatan ?? 0
  }

  let totalBiayaPupuk = 0
  for (const p of pupuk) {
    const hasil = JSON.parse(p.dataHasil) as { biaya?: number }[] | { biaya?: number }
    if (Array.isArray(hasil)) totalBiayaPupuk += hasil.reduce((s, i) => s + (i.biaya ?? 0), 0)
    else totalBiayaPupuk += hasil.biaya ?? 0
  }

  const tren: { bulan: string; tonase: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const start = new Date(sekarang.getFullYear(), sekarang.getMonth() - i, 1)
    const end = new Date(sekarang.getFullYear(), sekarang.getMonth() - i + 1, 1)
    const entries = await getDb().riwayatKalkulasi.findMany({
      where: { userId, jenisMenu: "pengiriman_tbs", tanggal: { gte: start, lt: end } },
    })
    const tonase = entries.reduce((s, e) => s + ((JSON.parse(e.dataInput) as { tonase?: number }).tonase ?? 0), 0)
    tren.push({
      bulan: start.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      tonase: Math.round(tonase * 100) / 100,
    })
  }

  return {
    total_luas: Math.round(totalLuas * 100) / 100,
    total_blok: bloks.length,
    total_produksi_bulan_ini: Math.round(totalProduksi * 100) / 100,
    total_pendapatan_bulan_ini: Math.round(totalPendapatan),
    total_biaya_pupuk_bulan_ini: Math.round(totalBiayaPupuk),
    estimasi_laba_rugi: Math.round(totalPendapatan - totalBiayaPupuk),
    tren_produksi: tren,
  }
}

export async function hapusRiwayat(id: string) {
  const userId = await requireUserId()
  const entry = await getDb().riwayatKalkulasi.findFirst({ where: { id, userId } })
  if (!entry) return { error: "Entri tidak ditemukan" }
  await getDb().riwayatKalkulasi.delete({ where: { id } })
  revalidatePath("/")
  return { ok: true }
}

export async function downloadPDF(entryIds: string[]) {
  if (!entryIds.length) return { error: "Pilih minimal 1 entri" }
  const userId = await requireUserId()
  const rows = await getDb().riwayatKalkulasi.findMany({
    where: { id: { in: entryIds }, userId },
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

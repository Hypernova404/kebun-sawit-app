import { fail, ok, type EngineResult, type LabaRugi } from "./types"

export function hitungBEP(biaya_tetap: number, harga_jual_per_unit: number, biaya_variabel_per_unit: number): EngineResult<number> {
  if (biaya_tetap < 0 || harga_jual_per_unit <= 0 || biaya_variabel_per_unit < 0) {
    return fail("INVALID_INPUT", "biaya_tetap, harga jual, dan biaya variabel harus valid (>0 untuk harga jual)")
  }
  const margin = harga_jual_per_unit - biaya_variabel_per_unit
  if (margin <= 0) {
    return fail("DIVISION_BY_ZERO", "Harga jual harus lebih besar dari biaya variabel — margin tidak boleh 0 atau negatif")
  }
  return ok(Math.round((biaya_tetap / margin) * 100) / 100)
}

export function hitungLabaRugi(total_pendapatan: number, total_biaya: number): EngineResult<LabaRugi> {
  const laba_rugi = Math.round(total_pendapatan - total_biaya)
  return ok({ laba_rugi, status: laba_rugi >= 0 ? "UNTUNG" : "RUGI" })
}

export function hitungPendapatanPengiriman(tonase: number, harga_per_kg: number): EngineResult<number> {
  if (tonase <= 0 || harga_per_kg <= 0) {
    return fail("INVALID_INPUT", "tonase dan harga_per_kg harus > 0")
  }
  return ok(Math.round(tonase * 1000 * harga_per_kg))
}

export const POTONGAN_SORTASI_DEFAULT = {
  mentah_persen: 50, // buah mentah: setengah berat dihilangkan dari pembayaran
  mengkal_persen: 15, // buah mengkal: potongan ringan
  busuk_persen: 100, // buah busuk/abnormal: tidak dibayar
} as const

export type SortasiInput = {
  persen_mentah: number
  persen_mengkal: number
  persen_busuk: number
}

export function hitungPendapatanSortasi(
  tonase: number,
  harga_per_kg: number,
  sortasi: SortasiInput,
  potongan: { mentah_persen?: number; mengkal_persen?: number } = {}
): EngineResult<{
  tonase_kotor: number
  tonase_bersih: number
  kg_dipotong: number
  pendapatan_kotor: number
  potongan_rp: number
  potongan_persen: number
  pendapatan: number
}> {
  if (tonase <= 0 || harga_per_kg <= 0) {
    return fail("INVALID_INPUT", "tonase dan harga_per_kg harus > 0")
  }
  const { persen_mentah, persen_mengkal, persen_busuk } = sortasi
  for (const [nama, v] of [
    ["buah mentah", persen_mentah],
    ["buah mengkal", persen_mengkal],
    ["buah busuk", persen_busuk],
  ] as const) {
    if (v < 0) return fail("INVALID_INPUT", `Persentase ${nama} tidak boleh negatif`)
  }
  if (persen_mentah + persen_mengkal + persen_busuk > 100) {
    return fail("INVALID_INPUT", "Total persentase sortasi melebihi 100%")
  }

  const fraksi_mentah = (persen_mentah / 100) * ((potongan.mentah_persen ?? POTONGAN_SORTASI_DEFAULT.mentah_persen) / 100)
  const fraksi_mengkal = (persen_mengkal / 100) * ((potongan.mengkal_persen ?? POTONGAN_SORTASI_DEFAULT.mengkal_persen) / 100)
  const fraksi_busuk = (persen_busuk / 100) * (POTONGAN_SORTASI_DEFAULT.busuk_persen / 100)
  const fraksi_total = fraksi_mentah + fraksi_mengkal + fraksi_busuk

  const berat_kg = tonase * 1000
  const kg_dipotong = berat_kg * fraksi_total
  const tonase_bersih = (berat_kg - kg_dipotong) / 1000
  const pendapatan_kotor = berat_kg * harga_per_kg
  const potongan_rp = kg_dipotong * harga_per_kg
  return ok({
    tonase_kotor: Math.round(tonase * 100) / 100,
    tonase_bersih: Math.round(tonase_bersih * 100) / 100,
    kg_dipotong: Math.round(kg_dipotong),
    pendapatan_kotor: Math.round(pendapatan_kotor),
    potongan_rp: Math.round(potongan_rp),
    potongan_persen: Math.round(fraksi_total * 10000) / 100,
    pendapatan: Math.round(pendapatan_kotor - potongan_rp),
  })
}

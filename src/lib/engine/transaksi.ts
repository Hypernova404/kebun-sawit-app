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

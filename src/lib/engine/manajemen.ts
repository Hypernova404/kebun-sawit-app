import { fail, ok, type EngineResult, type KebutuhanPemanenResult } from "./types"

export function hitungKebutuhanPemanen(
  total_kg_siap_panen: number,
  rotasi_hari: number,
  kapasitas_per_orang_per_hari = 500
): EngineResult<KebutuhanPemanenResult> {
  if (total_kg_siap_panen <= 0) {
    return fail("INVALID_INPUT", "total_kg_siap_panen harus > 0")
  }
  if (rotasi_hari <= 0 || kapasitas_per_orang_per_hari <= 0) {
    return fail("DIVISION_BY_ZERO", "rotasi_hari dan kapasitas_per_orang_per_hari harus > 0")
  }
  return ok({
    jumlah_pemanen: Math.ceil(total_kg_siap_panen / (kapasitas_per_orang_per_hari * rotasi_hari)),
    total_kg_siap_panen,
  })
}

import { fail, ok, type DosisResult, type EngineResult, type JadwalItem, type JadwalWilayah, type RainRecord, type StatusBlok } from "./types"

export const JENIS_PUPUK = ["Urea", "RP/TSP", "MOP", "Kieserit", "Mikro/HGFB"] as const

const TABEL_TBM: Record<string, Record<number, number>> = {
  "Urea": { 1: 200, 4: 250, 8: 350, 13: 350, 17: 450, 21: 600, 26: 650, 31: 750 },
  "RP/TSP": { 0: 350, 6: 450, 13: 450, 18: 500, 25: 600, 31: 600 },
  "MOP": { 3: 350, 14: 450, 20: 700, 26: 1000, 32: 1500 },
  "Kieserit": { 3: 250, 14: 350, 26: 400 },
  "Mikro/HGFB": { 3: 15, 7: 35, 13: 50, 19: 50, 25: 75, 31: 75 },
}

export const FAKTOR_JENIS_LAHAN: Record<string, number> = {
  mineral: 1.0,
  gambut: 1.15,
  pasir: 1.25,
  eks_lalang: 1.3,
}

const TABEL_TM: Record<string, Record<"3-8" | "9-13" | "14-20" | "21-25", number>> = {
  "Urea": { "3-8": 2.0, "9-13": 2.5, "14-20": 2.5, "21-25": 1.75 },
  "RP/TSP": { "3-8": 1.5, "9-13": 2.25, "14-20": 2.0, "21-25": 1.25 },
  "MOP": { "3-8": 1.5, "9-13": 2.25, "14-20": 2.0, "21-25": 1.25 },
  "Kieserit": { "3-8": 1.0, "9-13": 1.5, "14-20": 1.5, "21-25": 1.0 },
}

const JADWAL_WILAYAH: Record<string, JadwalWilayah> = {
  "Riau": { wilayah: "Riau", semester_1: { bulan: "Maret - April", label: "Semester I (akhir musim hujan)" }, semester_2: { bulan: "September - Oktober", label: "Semester II (awal musim hujan)" }, bulan_dihindari: ["Desember"] },
  "Sumatera Utara": { wilayah: "Sumatera Utara", semester_1: { bulan: "Februari - Maret", label: "Semester I" }, semester_2: { bulan: "Agustus - September", label: "Semester II" }, bulan_dihindari: [] },
  "Jambi": { wilayah: "Jambi", semester_1: { bulan: "Februari - Maret", label: "Semester I" }, semester_2: { bulan: "Agustus - September", label: "Semester II" }, bulan_dihindari: ["Januari"] },
  "Kalimantan Barat": { wilayah: "Kalimantan Barat", semester_1: { bulan: "Februari - Maret", label: "Semester I (akhir musim hujan)" }, semester_2: { bulan: "Pertengahan Juli - Pertengahan September", label: "Semester II (awal musim hujan)" }, bulan_dihindari: ["Oktober", "November", "Desember"] },
}

const PASANGAN_ANTAGONIS: [string, string][] = [
  ["Amonium(non-Urea)", "Alkalis"],
  ["Kalium", "Magnesium"],
  ["Kalium", "Kaptan"],
]

export function getDosisTBM(umur_bulan: number, jenis_pupuk: string, jenis_lahan = "mineral"): EngineResult<DosisResult> {
  if (umur_bulan < 0 || umur_bulan > 36) {
    return fail("INVALID_INPUT", "umur_bulan di luar rentang tabel TBM (0-36)")
  }
  const dosis = TABEL_TBM[jenis_pupuk]?.[umur_bulan]
  if (dosis == null) {
    return ok({ dosis: 0, source: "TBM_TABLE" })
  }
  const faktor = FAKTOR_JENIS_LAHAN[jenis_lahan] ?? 1.0
  return ok({ dosis: Math.round(dosis * faktor), source: "TBM_TABLE" })
}

export function getDosisTM(
  umur_tahun: number,
  jenis_pupuk: string,
  dosis_override: number | null = null
): EngineResult<DosisResult> {
  if (dosis_override != null) {
    return ok({ dosis: dosis_override, source: "LSU_OVERRIDE" })
  }
  if (umur_tahun < 3) {
    return fail("INVALID_INPUT", "umur_tahun < 3 seharusnya masih TBM, pakai getDosisTBM")
  }
  let kelompok: "3-8" | "9-13" | "14-20" | "21-25" | "REPLANTING_CANDIDATE"
  if (umur_tahun <= 8) kelompok = "3-8"
  else if (umur_tahun <= 13) kelompok = "9-13"
  else if (umur_tahun <= 20) kelompok = "14-20"
  else if (umur_tahun <= 25) kelompok = "21-25"
  else {
    return ok({
      dosis: null,
      source: "DEFAULT_TABLE",
      warning: "Umur > 25 tahun, pertimbangkan replanting — dosis mengikuti rekomendasi LSU terakhir",
    })
  }
  const dosis = TABEL_TM[jenis_pupuk]?.[kelompok]
  if (dosis == null) {
    return ok({ dosis: 0, source: "DEFAULT_TABLE" })
  }
  return ok({ dosis, source: "DEFAULT_TABLE" })
}

export function jadwalSemester(wilayah: string): EngineResult<JadwalWilayah> {
  const hasil = JADWAL_WILAYAH[wilayah]
  if (!hasil) {
    return fail("NOT_FOUND", "Wilayah belum dikonfigurasi, tambahkan di master data wilayah")
  }
  return ok(hasil)
}

export function hitungHariKering(records: RainRecord[]): number {
  let streak = 0
  let maxStreak = 0
  for (const r of records) {
    if (r.curah_hujan_mm <= 0) {
      streak++
      if (streak > maxStreak) maxStreak = streak
    } else {
      streak = 0
    }
  }
  return maxStreak
}

export function validasiWaktuAplikasi(jenis_pupuk: string, curah_hujan_7hari_terakhir: RainRecord[], curah_hujan_kemarin: number): EngineResult<string> {
  const hari_tanpa_hujan = hitungHariKering(curah_hujan_7hari_terakhir)
  if (jenis_pupuk === "Urea" && hari_tanpa_hujan >= 3) {
    return ok("TUNDA — resiko penguapan N, tunggu hujan")
  }
  if (hari_tanpa_hujan >= 7) {
    return ok("TUNDA — tanah terlalu kering")
  }
  if (curah_hujan_kemarin > 60) {
    return ok("TUNDA 1 HARI — tanah jenuh air")
  }
  return ok("APLIKASI OK")
}

export function cekJarakAntagonis(pupuk_a: string, pupuk_b: string, jarak_hari_rencana: number): EngineResult<string> {
  const isPasanganAntagonis = PASANGAN_ANTAGONIS.some(
    ([a, b]) => (pupuk_a === a && pupuk_b === b) || (pupuk_a === b && pupuk_b === a)
  )
  if (isPasanganAntagonis && jarak_hari_rencana < 3) {
    return ok("WARNING — jarak aplikasi kurang dari 3 hari, pisahkan jadwal")
  }
  return ok("OK")
}

export type BlokUntukJadwal = {
  tahun_tanam: number
  jenis_lahan: string
  dosis_override?: Record<string, number> | null
}

export function generateJadwalTahunan(blok: BlokUntukJadwal, tahun: number, wilayah: string): EngineResult<JadwalItem[]> {
  const jadwalResult = jadwalSemester(wilayah)
  if (!jadwalResult.success) return fail(jadwalResult.error!.code, jadwalResult.error!.message)

  const umur = tahun - blok.tahun_tanam
  if (umur < 0) return fail("INVALID_INPUT", "tahun_tanam tidak boleh di masa depan")
  const status: StatusBlok = umur < 3 ? "TBM" : "TM"

  const hasil: JadwalItem[] = []
  for (const jenis of JENIS_PUPUK) {
    let dosisResult: EngineResult<DosisResult>
    if (status === "TBM") {
      const startBulan = umur <= 0 ? 0 : (umur - 1) * 12 + 1
      const endBulan = umur * 12
      let total = 0
      for (let m = startBulan; m <= endBulan; m++) {
        total += getDosisTBM(m, jenis, blok.jenis_lahan).data?.dosis ?? 0
      }
      dosisResult = ok({ dosis: total, source: "TBM_TABLE" })
    } else {
      const override = blok.dosis_override?.[jenis] ?? null
      dosisResult = getDosisTM(umur, jenis, override)
    }
    if (!dosisResult.success || dosisResult.data?.dosis === 0 || dosisResult.data?.dosis == null) continue
    const frekuensi = jenis === "Urea" || jenis === "MOP" ? (blok.jenis_lahan === "pasir" ? 3 : 2) : 1
    hasil.push({
      jenis,
      dosis: dosisResult.data.dosis,
      dosis_source: dosisResult.data.source,
      frekuensi,
      jadwal_semester: jadwalResult.data!,
    })
  }
  return ok(hasil)
}

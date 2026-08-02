export type EngineResult<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

export const ok = <T>(data: T): EngineResult<T> => ({ success: true, data })
export const fail = <T>(code: string, message: string): EngineResult<T> => ({
  success: false,
  error: { code, message },
})

export type StatusBlok = "TBM" | "TM"

export type PopulasiResult = {
  pola: string
  jarak_tanam: number
  jarak_baris: number
  luas_per_pokok: number
  sph_desimal: number
  populasi_per_ha: number
  jumlah_pokok: number
  warning: string | null
}

export type BibitResult = {
  total_bibit: number
  cadangan: number
  warning: string | null
}

export type DesainBlokResult = {
  luas_efektif: number
  rasio_efektif: number
  status: string
}

export type JadwalWilayah = {
  wilayah: string
  semester_1: { bulan: string; label: string }
  semester_2: { bulan: string; label: string }
  bulan_dihindari: string[]
}

export type DosisResult = {
  dosis: number | null
  source: "TBM_TABLE" | "DEFAULT_TABLE" | "LSU_OVERRIDE"
  warning?: string
}

export type JadwalItem = {
  jenis: string
  dosis: number | null
  dosis_source: string
  frekuensi: number
  jadwal_semester: JadwalWilayah
}

export type PupukBlokItem = {
  jenis: string
  total_kg: number
  jumlah_sak: number
  biaya: number
}

export type ProduksiResult = {
  ton_per_ha: number
  total_ton: number
  warning: string | null
}

export type RendemenResult = {
  cpo_ton: number
  kernel_ton: number
  source: "DEFAULT_TABLE" | "MANUAL_OVERRIDE"
}

export type LabaRugi = {
  laba_rugi: number
  status: "UNTUNG" | "RUGI"
}

export type KebutuhanPemanenResult = {
  jumlah_pemanen: number
  total_kg_siap_panen: number
}

export type KonversiResult = {
  nilai: number
  dari_satuan: string
  ke_satuan: string
  faktor: number
}

export type RainRecord = {
  tanggal: string
  curah_hujan_mm: number
}

export type DetailBlok = {
  info_dasar: {
    id: string
    kode: string
    luas_ha: number
    tahun_tanam: number
    jumlah_pokok: number
    varietas: string | null
    jenis_lahan: string
    afdeling: string
    kebun: string
  }
  status: { umur: number; status: StatusBlok }
  riwayat_pupuk_terakhir: unknown
  riwayat_panen_bulan_ini: unknown[]
}

export type DashboardData = {
  total_luas: number
  total_blok: number
  total_produksi_bulan_ini: number
  total_pendapatan_bulan_ini: number
  total_biaya_pupuk_bulan_ini: number
  estimasi_laba_rugi: number
  tren_produksi: { bulan: string; tonase: number }[]
}

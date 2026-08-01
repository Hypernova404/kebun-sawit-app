import { PrismaClient } from "../generated/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaLibSql as PrismaLibSqlWeb } from "@prisma/adapter-libsql/web"

const url = process.env.DATABASE_URL ?? "file:./dev.db"
const authToken = process.env.TURSO_AUTH_TOKEN
const opts = authToken ? { url, authToken } : { url }
const adapter = url.startsWith("file:") ? new PrismaLibSql(opts) : new PrismaLibSqlWeb(opts)
const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: "demo@example.com",
      name: "Demo User",
      emailVerified: true,
    },
  })

  const kebun = await prisma.kebun.create({
    data: {
      userId: user.id,
      nama: "Kebun Sungai Deras",
      lokasi: "Kabupaten Ketapang, Kalimantan Barat",
      wilayah: "Kalimantan Barat",
    },
  })

  const afdeling1 = await prisma.afdeling.create({
    data: { kebunId: kebun.id, kode: "A1", nama: "Afdeling Utara", luasHa: 620 },
  })
  const afdeling2 = await prisma.afdeling.create({
    data: { kebunId: kebun.id, kode: "A2", nama: "Afdeling Selatan", luasHa: 585 },
  })

  await prisma.blok.createMany({
    data: [
      { kebunId: kebun.id, afdelingId: afdeling1.id, kode: "A1-01", luasHa: 29.5, tahunTanam: 2016, jumlahPokok: 4218, varietas: "Tenera", jenisLahan: "mineral" },
      { kebunId: kebun.id, afdelingId: afdeling1.id, kode: "A1-02", luasHa: 30.2, tahunTanam: 2018, jumlahPokok: 4319, varietas: "Tenera", jenisLahan: "mineral" },
      { kebunId: kebun.id, afdelingId: afdeling1.id, kode: "A1-03", luasHa: 28.8, tahunTanam: 2013, jumlahPokok: 4118, varietas: "Tenera", jenisLahan: "gambut" },
      { kebunId: kebun.id, afdelingId: afdeling2.id, kode: "A2-01", luasHa: 30.5, tahunTanam: 2023, jumlahPokok: 4362, varietas: "Tenera", jenisLahan: "mineral" },
      { kebunId: kebun.id, afdelingId: afdeling2.id, kode: "A2-02", luasHa: 27.9, tahunTanam: 2020, jumlahPokok: 3989, varietas: "Dura", jenisLahan: "pasir" },
    ],
  })

  console.log("Seed selesai: 1 user, 1 kebun, 2 afdeling, 5 blok")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

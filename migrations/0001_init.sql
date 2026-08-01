-- CreateTable
CREATE TABLE "Kebun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "lokasi" TEXT,
    "wilayah" TEXT NOT NULL DEFAULT 'Kalimantan Barat',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Afdeling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kebunId" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT,
    "luasHa" REAL NOT NULL,
    CONSTRAINT "Afdeling_kebunId_fkey" FOREIGN KEY ("kebunId") REFERENCES "Kebun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Blok" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "afdelingId" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "luasHa" REAL NOT NULL,
    "tahunTanam" INTEGER NOT NULL,
    "jumlahPokok" INTEGER NOT NULL DEFAULT 0,
    "varietas" TEXT,
    "jenisLahan" TEXT NOT NULL DEFAULT 'mineral',
    "dosisOverride" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Blok_afdelingId_fkey" FOREIGN KEY ("afdelingId") REFERENCES "Afdeling" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiwayatKalkulasi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jenisMenu" TEXT NOT NULL,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataInput" TEXT NOT NULL,
    "dataHasil" TEXT NOT NULL,
    "blokId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiwayatKalkulasi_blokId_fkey" FOREIGN KEY ("blokId") REFERENCES "Blok" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Afdeling_kebunId_kode_key" ON "Afdeling"("kebunId", "kode");

-- CreateIndex
CREATE UNIQUE INDEX "Blok_kode_key" ON "Blok"("kode");


-- Reset tabel lama (data seed demo) lalu skema baru dengan auth & multi-user
DROP TABLE IF EXISTS "RiwayatKalkulasi";
DROP TABLE IF EXISTS "Blok";
DROP TABLE IF EXISTS "Afdeling";
DROP TABLE IF EXISTS "Kebun";

-- CreateTable
CREATE TABLE "Kebun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "lokasi" TEXT,
    "wilayah" TEXT NOT NULL DEFAULT 'Kalimantan Barat',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kebun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "kebunId" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "luasHa" REAL NOT NULL,
    "tahunTanam" INTEGER NOT NULL,
    "jumlahPokok" INTEGER NOT NULL DEFAULT 0,
    "varietas" TEXT,
    "jenisLahan" TEXT NOT NULL DEFAULT 'mineral',
    "dosisOverride" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Blok_afdelingId_fkey" FOREIGN KEY ("afdelingId") REFERENCES "Afdeling" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Blok_kebunId_fkey" FOREIGN KEY ("kebunId") REFERENCES "Kebun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiwayatKalkulasi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jenisMenu" TEXT NOT NULL,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataInput" TEXT NOT NULL,
    "dataHasil" TEXT NOT NULL,
    "blokId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiwayatKalkulasi_blokId_fkey" FOREIGN KEY ("blokId") REFERENCES "Blok" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RiwayatKalkulasi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Kebun_userId_idx" ON "Kebun"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Afdeling_kebunId_kode_key" ON "Afdeling"("kebunId", "kode");

-- CreateIndex
CREATE UNIQUE INDEX "Blok_kebunId_kode_key" ON "Blok"("kebunId", "kode");

-- CreateIndex
CREATE INDEX "RiwayatKalkulasi_userId_idx" ON "RiwayatKalkulasi"("userId");

-- CreateIndex
CREATE INDEX "RiwayatKalkulasi_jenisMenu_tanggal_idx" ON "RiwayatKalkulasi"("jenisMenu", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

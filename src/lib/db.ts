import { PrismaClient } from "../../generated/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaLibSql as PrismaLibSqlWeb } from "@prisma/adapter-libsql/web"
import { cache } from "react"

export function makeAdapter() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db"
  const authToken = process.env.TURSO_AUTH_TOKEN
  const opts = authToken ? { url, authToken } : { url }
  if (url.startsWith("file:")) {
    return new PrismaLibSql(opts)
  }
  return new PrismaLibSqlWeb(opts)
}

const globalForPrisma = globalThis as unknown as { prismaSingleton?: PrismaClient }

export function getPrismaSingleton(): PrismaClient {
  if (!globalForPrisma.prismaSingleton) {
    globalForPrisma.prismaSingleton = new PrismaClient({ adapter: makeAdapter() })
  }
  return globalForPrisma.prismaSingleton
}

export const getDb = cache(() => {
  return new PrismaClient({ adapter: makeAdapter() })
})

export const getDbAsync = async () => {
  return new PrismaClient({ adapter: makeAdapter() })
}

import { PrismaClient } from "../../generated/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaLibSql as PrismaLibSqlWeb } from "@prisma/adapter-libsql/web"
import { cache } from "react"

const makeAdapter = () => {
  const url = process.env.DATABASE_URL ?? "file:./dev.db"
  const authToken = process.env.TURSO_AUTH_TOKEN
  const opts = authToken ? { url, authToken } : { url }
  if (url.startsWith("file:")) {
    return new PrismaLibSql(opts)
  }
  return new PrismaLibSqlWeb(opts)
}

export const getDb = cache(() => {
  return new PrismaClient({ adapter: makeAdapter() })
})

export const getDbAsync = async () => {
  return new PrismaClient({ adapter: makeAdapter() })
}

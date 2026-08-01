import { PrismaClient } from "../../generated/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { cache } from "react"

const makeAdapter = () => {
  const url = process.env.DATABASE_URL ?? "file:./dev.db"
  const authToken = process.env.TURSO_AUTH_TOKEN
  return new PrismaLibSql(authToken ? { url, authToken } : { url })
}

export const getDb = cache(() => {
  return new PrismaClient({ adapter: makeAdapter() })
})

export const getDbAsync = async () => {
  return new PrismaClient({ adapter: makeAdapter() })
}

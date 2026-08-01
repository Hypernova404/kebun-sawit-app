import { NextResponse } from "next/server"
import { createClient } from "@libsql/client/web"

export const dynamic = "force-dynamic"

export async function GET() {
  const out: Record<string, unknown> = {}
  try {
    const client = createClient({
      url: process.env.DATABASE_URL ?? "",
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const simple = await client.execute({ sql: "SELECT COUNT(*) AS n FROM Blok" })
    out.simple = simple.rows
    try {
      const raw = await client.execute({ sql: "SELECT * FROM Blok ORDER BY kode LIMIT 3" })
      out.raw = raw.rows
    } catch (e) {
      out.rawErr = String((e as Error).message)
    }
    await client.close()
    out.final = "ok"
  } catch (e) {
    const err = e as Error
    out.final = "error"
    out.error = err.message
    out.cause = String((err as { cause?: unknown }).cause)
  }
  return NextResponse.json(out)
}

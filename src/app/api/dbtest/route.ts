import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const url = process.env.DATABASE_URL ?? ""
  const token = process.env.TURSO_AUTH_TOKEN ?? ""
  const endpoint = `${url}/v2/pipeline`
  const results: Record<string, unknown> = { endpoint }

  const attempt = async (label: string, body: unknown, headers: Record<string, string> = {}) => {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...headers },
        body: JSON.stringify(body),
      })
      const text = await res.text()
      results[label] = { status: res.status, body: text.slice(0, 500) }
    } catch (e) {
      results[label] = { error: String((e as Error).message) }
    }
  }

  await attempt("select1", {
    requests: [{ type: "execute", stmt: { sql: "SELECT 1 AS x" }, wantRows: true }],
  })
  await attempt("noRows", {
    requests: [{ type: "execute", stmt: { sql: "SELECT 1 AS x" } }],
  })
  await attempt("badBody", { requests: "nope" })

  return NextResponse.json(results)
}

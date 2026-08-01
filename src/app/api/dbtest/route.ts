import { NextResponse } from "next/server"
import { getDbAsync } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const db = await getDbAsync()
    const blok = await db.blok.findMany()
    const kebun = await db.kebun.findMany()
    return NextResponse.json({ ok: true, blok: blok.length, kebun: kebun.length })
  } catch (e) {
    const err = e as { message?: string; meta?: unknown; cause?: unknown }
    return NextResponse.json(
      {
        ok: false,
        message: err.message,
        meta: JSON.stringify(err.meta, null, 1),
        cause: JSON.stringify(err.cause, null, 1),
        causeStr: String(err.cause),
      },
      { status: 200 },
    )
  }
}

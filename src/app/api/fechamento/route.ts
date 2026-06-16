import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseQuery, handleApiError, anoSchema, mesSchema } from "@/lib/api-helpers"
import { getStatus } from "@/lib/repositories/fechamento-repository"

export async function GET(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = parseQuery(new URL(req.url).searchParams, z.object({ ano: anoSchema, mes: mesSchema }))
  if (!parsed.ok) return parsed.response
  try { return NextResponse.json({ status: await getStatus(parsed.data.ano, parsed.data.mes) }) }
  catch (e) { return handleApiError(e, "Erro ao obter status.") }
}

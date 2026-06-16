import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseBody, handleApiError, anoSchema, mesSchema } from "@/lib/api-helpers"
import { concluir } from "@/lib/repositories/fechamento-repository"

export async function POST(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = await parseBody(req, z.object({ ano: anoSchema, mes: mesSchema })); if (!parsed.ok) return parsed.response
  try { await concluir(parsed.data.ano, parsed.data.mes, auth.usuario.email); return NextResponse.json({ ok: true }) }
  catch (e) { return handleApiError(e, "Falha ao concluir mês.") }
}

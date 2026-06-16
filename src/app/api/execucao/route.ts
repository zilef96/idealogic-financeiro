import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseQuery, handleApiError, anoSchema } from "@/lib/api-helpers"
import { getExecucao } from "@/lib/repositories/execucao-repository"

export async function GET(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = parseQuery(new URL(req.url).searchParams, z.object({ ano: anoSchema }))
  if (!parsed.ok) return parsed.response
  try { return NextResponse.json({ linhas: await getExecucao(parsed.data.ano) }) }
  catch (e) { return handleApiError(e, "Erro ao carregar execução.") }
}

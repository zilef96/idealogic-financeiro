import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseQuery, parseBody, handleApiError, anoSchema } from "@/lib/api-helpers"
import { getParametrosExercicio, gravarParametroExercicio } from "@/lib/repositories/parametro-repository"
import { PARAMETROS_EXERCICIO } from "@/lib/services/parametros-service"

const chaveSchema = z.enum(PARAMETROS_EXERCICIO.map((p) => p.chave) as [string, ...string[]])

export async function GET(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = parseQuery(new URL(req.url).searchParams, z.object({ ano: anoSchema }))
  if (!parsed.ok) return parsed.response
  try { return NextResponse.json({ ano: parsed.data.ano, valores: await getParametrosExercicio(parsed.data.ano) }) }
  catch (e) { return handleApiError(e, "Erro ao carregar parâmetros.") }
}

export async function PUT(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = await parseBody(req, z.object({ ano: anoSchema, chave: chaveSchema, valor: z.coerce.number().min(0) }))
  if (!parsed.ok) return parsed.response
  try {
    await gravarParametroExercicio(parsed.data.ano, parsed.data.chave as never, parsed.data.valor)
    return NextResponse.json({ ok: true })
  } catch (e) { return handleApiError(e, "Falha ao gravar parâmetro.") }
}

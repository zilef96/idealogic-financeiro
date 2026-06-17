import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseQuery, parseBody, handleApiError, anoSchema } from "@/lib/api-helpers"
import { getStatusExercicio, publicarExercicio, despublicarExercicio } from "@/lib/repositories/periodo-repository"

export async function GET(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = parseQuery(new URL(req.url).searchParams, z.object({ ano: anoSchema }))
  if (!parsed.ok) return parsed.response
  try { return NextResponse.json({ ano: parsed.data.ano, status: await getStatusExercicio(parsed.data.ano) }) }
  catch (e) { return handleApiError(e, "Erro ao ler status do período.") }
}

export async function POST(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = await parseBody(req, z.object({ ano: anoSchema, acao: z.enum(["publicar", "despublicar"]) }))
  if (!parsed.ok) return parsed.response
  try {
    if (parsed.data.acao === "publicar") await publicarExercicio(parsed.data.ano)
    else await despublicarExercicio(parsed.data.ano)
    return NextResponse.json({ ok: true })
  } catch (e) { return handleApiError(e, "Falha ao alterar status do período.") }
}

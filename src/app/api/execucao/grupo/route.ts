import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseBody, handleApiError, idPositivoSchema } from "@/lib/api-helpers"
import { criarGrupoExecucao } from "@/lib/repositories/orcamento-repository"

const novoGrupo = z.object({
  grupoPaiId: idPositivoSchema,
  nome: z.string().trim().min(1),
})

export async function POST(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = await parseBody(req, novoGrupo); if (!parsed.ok) return parsed.response
  try { return NextResponse.json({ id: await criarGrupoExecucao(parsed.data) }, { status: 201 }) }
  catch (e) { return handleApiError(e, "Falha ao criar categoria na execução.") }
}

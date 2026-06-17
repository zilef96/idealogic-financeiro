import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseBody, handleApiError, idPositivoSchema } from "@/lib/api-helpers"
import { atualizarGrupo, excluirGrupo } from "@/lib/repositories/orcamento-repository"

const patch = z.object({ nome: z.string().trim().min(1) })

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const { id } = await params
  const pid = idPositivoSchema.safeParse(id)
  if (!pid.success) return NextResponse.json({ error: "id inválido." }, { status: 400 })
  const parsed = await parseBody(req, patch); if (!parsed.ok) return parsed.response
  try { await atualizarGrupo(pid.data, parsed.data.nome); return NextResponse.json({ ok: true }) }
  catch (e) { return handleApiError(e, "Falha ao atualizar grupo.") }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const { id } = await params
  const pid = idPositivoSchema.safeParse(id)
  if (!pid.success) return NextResponse.json({ error: "id inválido." }, { status: 400 })
  try { await excluirGrupo(pid.data); return NextResponse.json({ ok: true }) }
  catch (e) { return handleApiError(e, "Falha ao excluir grupo.") }
}

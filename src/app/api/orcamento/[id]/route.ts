import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseBody, handleApiError, idPositivoSchema, mesSchema, valorNaoNegativoSchema } from "@/lib/api-helpers"
import { atualizarItem, excluirItem } from "@/lib/repositories/orcamento-repository"

const patch = z.object({
  nome: z.string().trim().min(1).optional(),
  periodicidade: z.enum(["M", "A"]).optional(),
  valor: valorNaoNegativoSchema.optional(),
  classificacao: z.enum(["C", "P", "E", "S"]).nullable().optional(),
  mesInicio: mesSchema.nullable().optional(),
  mesFim: mesSchema.nullable().optional(),
  comentarios: z.string().trim().nullable().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const { id } = await params
  const pid = idPositivoSchema.safeParse(id)
  if (!pid.success) return NextResponse.json({ error: "id inválido." }, { status: 400 })
  const parsed = await parseBody(req, patch); if (!parsed.ok) return parsed.response
  try { await atualizarItem(pid.data, parsed.data); return NextResponse.json({ ok: true }) }
  catch (e) { return handleApiError(e, "Falha ao atualizar item.") }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const { id } = await params
  const pid = idPositivoSchema.safeParse(id)
  if (!pid.success) return NextResponse.json({ error: "id inválido." }, { status: 400 })
  try { await excluirItem(pid.data); return NextResponse.json({ ok: true }) }
  catch (e) { return handleApiError(e, "Falha ao excluir item.") }
}

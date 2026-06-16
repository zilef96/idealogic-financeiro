import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseQuery, parseBody, handleApiError, anoSchema, mesSchema, idPositivoSchema, valorNaoNegativoSchema } from "@/lib/api-helpers"
import { listarTesouraria, criarTesouraria, removerTesouraria } from "@/lib/repositories/fechamento-repository"

export async function GET(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = parseQuery(new URL(req.url).searchParams, z.object({ ano: anoSchema }))
  if (!parsed.ok) return parsed.response
  try { return NextResponse.json({ eventos: await listarTesouraria(parsed.data.ano) }) }
  catch (e) { return handleApiError(e, "Erro ao listar tesouraria.") }
}

const novo = z.object({
  ano: anoSchema, mes: mesSchema, tipo: z.enum(["aplicacao", "resgate"]),
  valor: valorNaoNegativoSchema, descricao: z.string().trim().nullable().default(null),
})

export async function POST(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = await parseBody(req, novo); if (!parsed.ok) return parsed.response
  const { ano, mes, tipo, valor, descricao } = parsed.data
  try { await criarTesouraria(ano, mes, tipo, valor, descricao); return NextResponse.json({ ok: true }, { status: 201 }) }
  catch (e) { return handleApiError(e, "Falha ao criar evento.") }
}

export async function DELETE(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = parseQuery(new URL(req.url).searchParams, z.object({ id: idPositivoSchema }))
  if (!parsed.ok) return parsed.response
  try { await removerTesouraria(parsed.data.id); return NextResponse.json({ ok: true }) }
  catch (e) { return handleApiError(e, "Falha ao remover evento.") }
}

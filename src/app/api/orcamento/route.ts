import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseQuery, parseBody, handleApiError, anoSchema, idPositivoSchema, mesSchema, valorNaoNegativoSchema } from "@/lib/api-helpers"
import { getOrcamento, getGrupos, criarItem } from "@/lib/repositories/orcamento-repository"

export async function GET(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = parseQuery(new URL(req.url).searchParams, z.object({ ano: anoSchema }))
  if (!parsed.ok) return parsed.response
  try {
    const [linhas, grupos] = await Promise.all([getOrcamento(parsed.data.ano), getGrupos(parsed.data.ano)])
    return NextResponse.json({ ano: parsed.data.ano, linhas, grupos })
  } catch (e) { return handleApiError(e, "Erro ao carregar orçamento.") }
}

const novoItem = z.object({
  grupoId: idPositivoSchema,
  nome: z.string().trim().min(1),
  periodicidade: z.enum(["M", "A"]),
  valor: valorNaoNegativoSchema,
  classificacao: z.enum(["C", "P", "E", "S"]).nullable().default(null),
  mesInicio: mesSchema.nullable().default(null),
  mesFim: mesSchema.nullable().default(null),
})

export async function POST(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = await parseBody(req, novoItem); if (!parsed.ok) return parsed.response
  try {
    const id = await criarItem(parsed.data)
    return NextResponse.json({ id }, { status: 201 })
  } catch (e) { return handleApiError(e, "Falha ao criar item.") }
}

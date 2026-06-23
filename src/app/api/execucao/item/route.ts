import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseBody, handleApiError, idPositivoSchema, mesSchema, valorNaoNegativoSchema } from "@/lib/api-helpers"
import { criarItemExecucao } from "@/lib/repositories/orcamento-repository"

const novoItem = z.object({
  grupoId: idPositivoSchema,
  nome: z.string().trim().min(1),
  periodicidade: z.enum(["M", "A"]),
  valor: valorNaoNegativoSchema,
  classificacao: z.enum(["C", "P", "E", "S"]).nullable().default(null),
  mesInicio: mesSchema.nullable().default(null),
  mesFim: mesSchema.nullable().default(null),
}).superRefine((d, ctx) => {
  if (d.periodicidade === "M") {
    if (d.mesInicio == null || d.mesFim == null) {
      ctx.addIssue({ code: "custom", message: "Vigência obrigatória para item mensal.", path: ["mesInicio"] })
    } else if (d.mesInicio > d.mesFim) {
      ctx.addIssue({ code: "custom", message: "mesInicio deve ser ≤ mesFim.", path: ["mesFim"] })
    }
  }
})

export async function POST(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = await parseBody(req, novoItem); if (!parsed.ok) return parsed.response
  try { return NextResponse.json({ id: await criarItemExecucao(parsed.data) }, { status: 201 }) }
  catch (e) { return handleApiError(e, "Falha ao criar item na execução.") }
}

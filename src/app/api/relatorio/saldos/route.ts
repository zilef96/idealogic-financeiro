import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseBody, handleApiError, anoSchema, mesSchema, valorNaoNegativoSchema } from "@/lib/api-helpers"
import { gravarSaldosBancarios } from "@/lib/repositories/parametro-repository"

const bodySchema = z.object({
  ano: anoSchema,
  mes: mesSchema,
  saldoSicrediCc: valorNaoNegativoSchema,
  saldoSicrediAplicacao: valorNaoNegativoSchema,
  saldoBanrisulCc: valorNaoNegativoSchema,
  rendimentoSicrediAplicacao: valorNaoNegativoSchema,
})

export async function POST(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = await parseBody(req, bodySchema)
  if (!parsed.ok) return parsed.response
  const { ano, mes, saldoSicrediCc, saldoSicrediAplicacao, saldoBanrisulCc, rendimentoSicrediAplicacao } = parsed.data
  try {
    await gravarSaldosBancarios(ano, mes, {
      sicrediCc: saldoSicrediCc,
      sicrediAplicacao: saldoSicrediAplicacao,
      banrisulCc: saldoBanrisulCc,
      rendimentoSicrediAplicacao,
    })
    return NextResponse.json({ ok: true })
  } catch (e) { return handleApiError(e, "Falha ao gravar saldos bancários.") }
}

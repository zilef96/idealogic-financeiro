import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseBody, handleApiError, anoSchema, mesSchema, valorNaoNegativoSchema } from "@/lib/api-helpers"
import { gravarParametroMensal } from "@/lib/repositories/parametro-repository"
import { CHAVES_EDITAVEIS_MODAL } from "@/lib/services/parametros-service"

const chaveSchema = z.enum(CHAVES_EDITAVEIS_MODAL)

export async function PUT(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = await parseBody(req, z.object({
    ano: anoSchema, mes: mesSchema, chave: chaveSchema, valor: valorNaoNegativoSchema,
  }))
  if (!parsed.ok) return parsed.response
  try {
    await gravarParametroMensal(parsed.data.ano, parsed.data.mes, parsed.data.chave, parsed.data.valor)
    return NextResponse.json({ ok: true })
  } catch (e) { return handleApiError(e, "Falha ao gravar parâmetro.") }
}

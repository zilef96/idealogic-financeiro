import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseBody, handleApiError, anoSchema, mesSchema, idPositivoSchema, valorNaoNegativoSchema } from "@/lib/api-helpers"
import { gravarRealizado } from "@/lib/repositories/execucao-repository"

const schema = z.object({ ano: anoSchema, mes: mesSchema, contaItemId: idPositivoSchema, valor: valorNaoNegativoSchema })

export async function PATCH(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = await parseBody(req, schema); if (!parsed.ok) return parsed.response
  const { ano, mes, contaItemId, valor } = parsed.data
  try { await gravarRealizado(ano, mes, contaItemId, valor); return NextResponse.json({ ok: true }) }
  catch (e) { return handleApiError(e, "Falha ao gravar realizado.") }
}

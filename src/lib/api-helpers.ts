import { NextResponse } from "next/server"
import { z } from "zod"

export const anoSchema = z.coerce.number().int().min(2000).max(2100)
export const mesSchema = z.coerce.number().int().min(1).max(12)
export const idPositivoSchema = z.coerce.number().int().positive()
export const valorNaoNegativoSchema = z.coerce.number().min(0)

export function mapErroPostgres(e: { code?: string; meta?: { code?: string }; message?: string }) {
  // Postgres direto traz code "FC001"; o Prisma encapsula em P2010 com
  // meta.code = "FC001" (e o marcador também aparece na mensagem).
  const ehFC001 =
    e?.code === "FC001" ||
    e?.meta?.code === "FC001" ||
    (typeof e?.message === "string" && e.message.includes("FC001"))
  if (ehFC001) {
    return { status: 409, error: "Competência fechada; reabra o mês para editar." }
  }
  if (typeof e?.message === "string" && e.message.includes("OR_PUBLICADO")) {
    return { status: 409, error: "Orçamento publicado; despublique o ano para editar." }
  }
  if (typeof e?.message === "string" && e.message.includes("GRUPO_NAO_VAZIO")) {
    return { status: 409, error: "Grupo não está vazio; remova itens e subgrupos antes de excluir." }
  }
  if (typeof e?.message === "string" && e.message.includes("VIGENCIA_MES_FECHADO")) {
    return { status: 409, error: "Período inclui mês concluído; ajuste a vigência." }
  }
  if (typeof e?.message === "string" && e.message.includes("PERIODO_DUPLICADO")) {
    return { status: 409, error: "Período já existe para esse ano." }
  }
  if (typeof e?.message === "string" && e.message.includes("ORIGEM_INEXISTENTE")) {
    return { status: 422, error: "Ano de origem inexistente." }
  }
  return null
}

export function handleApiError(e: unknown, msgPadrao: string) {
  const pg = mapErroPostgres(e as { code?: string; meta?: { code?: string }; message?: string })
  if (pg) return NextResponse.json({ error: pg.error }, { status: pg.status })
  console.error(e)
  return NextResponse.json({ error: msgPadrao }, { status: 500 })
}

export function parseQuery<T extends z.ZodTypeAny>(params: URLSearchParams, schema: T) {
  const obj = Object.fromEntries(params.entries())
  const r = schema.safeParse(obj)
  if (!r.success) return { ok: false as const, response: NextResponse.json({ error: z.flattenError(r.error) }, { status: 422 }) }
  return { ok: true as const, data: r.data as z.infer<T> }
}

export async function parseBody<T extends z.ZodTypeAny>(req: Request, schema: T) {
  let json: unknown
  try { json = await req.json() } catch { return { ok: false as const, response: NextResponse.json({ error: "JSON inválido." }, { status: 400 }) } }
  const r = schema.safeParse(json)
  if (!r.success) return { ok: false as const, response: NextResponse.json({ error: z.flattenError(r.error) }, { status: 422 }) }
  return { ok: true as const, data: r.data as z.infer<T> }
}

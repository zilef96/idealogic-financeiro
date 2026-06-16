import { prisma } from "@/lib/prisma"

export type SeriesParametros = Record<string, { mes: number; valor: number }[]>

// Lê parametro_mensal do ano e agrupa por chave (série {mes, valor}, ordenada).
export async function getSeriesParametros(ano: number): Promise<SeriesParametros> {
  const rows = await prisma.$queryRaw<{ chave: string; mes: number; valor: unknown }[]>`
    SELECT pm.chave, EXTRACT(MONTH FROM pm.competencia)::int AS mes, pm.valor
    FROM parametro_mensal pm JOIN exercicio e ON e.id = pm.exercicio_id
    WHERE e.ano = ${ano}
    ORDER BY pm.chave, pm.competencia
  `
  const out: SeriesParametros = {}
  for (const r of rows) {
    ;(out[r.chave] ??= []).push({ mes: r.mes, valor: Number(r.valor) })
  }
  return out
}

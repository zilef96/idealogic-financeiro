import { prisma } from "@/lib/prisma"
import { PARAMETROS_EXERCICIO, valorExercicio, type ChaveParametro } from "@/lib/services/parametros-service"

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

export async function getParametrosExercicio(ano: number): Promise<Record<ChaveParametro, number>> {
  const series = await getSeriesParametros(ano)
  const out = {} as Record<ChaveParametro, number>
  for (const def of PARAMETROS_EXERCICIO) {
    out[def.chave] = valorExercicio(series[def.chave] ?? [], def.padrao)
  }
  return out
}

export async function gravarParametroExercicio(ano: number, chave: ChaveParametro, valor: number): Promise<void> {
  const comp = `${ano}-01-01`
  await prisma.$executeRaw`
    INSERT INTO parametro_mensal (exercicio_id, competencia, chave, valor)
    SELECT e.id, ${comp}::date, ${chave}, ${valor}::numeric FROM exercicio e WHERE e.ano = ${ano}
    ON CONFLICT (exercicio_id, competencia, chave)
    DO UPDATE SET valor = EXCLUDED.valor
  `
}

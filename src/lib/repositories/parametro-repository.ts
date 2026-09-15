import { prisma } from "@/lib/prisma"
import { type ChaveParametro } from "@/lib/services/parametros-service"

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

export async function gravarParametroMensal(ano: number, mes: number, chave: ChaveParametro, valor: number): Promise<void> {
  const comp = `${ano}-${String(mes).padStart(2, "0")}-01`
  await prisma.$executeRaw`
    INSERT INTO parametro_mensal (exercicio_id, competencia, chave, valor)
    SELECT e.id, ${comp}::date, ${chave}, ${valor}::numeric FROM exercicio e WHERE e.ano = ${ano}
    ON CONFLICT (exercicio_id, competencia, chave)
    DO UPDATE SET valor = EXCLUDED.valor
  `
}

// Saldos bancários por competência (mensal) — usados pelo Relatório de Informação.
// Chaves fixas no MVP; contas Sicredi (CC + aplicação) e Banrisul (CC).
// rendimentoSicrediAplicacao: quanto a aplicação rendeu naquele mês (R$); mesma
// competência/chave-valor da família de saldos, só que não é saldo, é o rendimento.
export async function gravarSaldosBancarios(
  ano: number,
  mes: number,
  saldos: { sicrediCc: number; sicrediAplicacao: number; banrisulCc: number; rendimentoSicrediAplicacao: number },
): Promise<void> {
  const comp = `${ano}-${String(mes).padStart(2, "0")}-01`
  const pares: [string, number][] = [
    ["saldo_sicredi_cc", saldos.sicrediCc],
    ["saldo_sicredi_aplicacao", saldos.sicrediAplicacao],
    ["saldo_banrisul_cc", saldos.banrisulCc],
    ["rendimento_sicredi_aplicacao", saldos.rendimentoSicrediAplicacao],
  ]
  for (const [chave, valor] of pares) {
    await prisma.$executeRaw`
      INSERT INTO parametro_mensal (exercicio_id, competencia, chave, valor)
      SELECT e.id, ${comp}::date, ${chave}, ${valor}::numeric FROM exercicio e WHERE e.ano = ${ano}
      ON CONFLICT (exercicio_id, competencia, chave)
      DO UPDATE SET valor = EXCLUDED.valor
    `
  }
}

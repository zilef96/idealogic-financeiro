import { prisma } from "@/lib/prisma"

// Total realizado de Despesas (bloco 30000 = OPEX) por mês do ano; null = sem lançamento.
export async function getDespesasRealizadasPorMes(ano: number): Promise<{ mes: number; valor: number | null }[]> {
  const rows = await prisma.$queryRaw<{ mes: number; realizado: unknown }[]>`
    SELECT mes, realizado FROM vw_execucao_mensal
    WHERE ano = ${ano} AND is_grupo AND codigo = '30000'
    ORDER BY mes
  `
  return rows.map((r) => ({ mes: r.mes, valor: r.realizado == null ? null : Number(r.realizado) }))
}

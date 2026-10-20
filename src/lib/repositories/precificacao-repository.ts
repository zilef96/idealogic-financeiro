import { prisma } from "@/lib/prisma"
import { REGRA_OPEX, type LinhaRealizado } from "@/lib/services/precificacao-service"

// Realizado mensal só das contas que a REGRA_OPEX usa (grupos pelo código; itens pelo grupo pai).
export async function getRealizadoContasOpex(ano: number): Promise<LinhaRealizado[]> {
  const contas = [REGRA_OPEX.base, ...REGRA_OPEX.tirar, ...REGRA_OPEX.somar]
  const grupos = contas.filter((c) => c.nome == null).map((c) => c.grupo)
  const pais = [...new Set(contas.filter((c) => c.nome != null).map((c) => c.grupo))]
  const rows = await prisma.$queryRaw<{ codigo: string | null; codigo_pai: string | null; nome: string; is_grupo: boolean; mes: number; realizado: unknown }[]>`
    SELECT codigo, codigo_pai, nome, is_grupo, mes, realizado FROM vw_execucao_mensal
    WHERE ano = ${ano}
      AND ((is_grupo AND codigo = ANY(${grupos})) OR (NOT is_grupo AND codigo_pai = ANY(${pais})))
  `
  return rows.map((r) => ({
    codigo: r.codigo ?? "", codigoPai: r.codigo_pai ?? "", nome: r.nome, isGrupo: r.is_grupo, mes: r.mes,
    realizado: r.realizado == null ? null : Number(r.realizado),
  }))
}

import { prisma } from "@/lib/prisma"
import { calcDesvio } from "@/lib/services/execucao-service"

export interface LinhaExecucao {
  codigoPai: string
  codigo: string
  nome: string
  isGrupo: boolean
  mes: number
  orcadoProjetado: number   // referência travada (vigência, sem ajuste)
  orcado: number            // orçado mensal efetivo (já com ajuste)
  realizado: number | null
  desvio: number
  desvioPercentual: number | null
}

interface Row {
  codigo_pai: string; codigo: string; nome: string; mes: number
  orcado: unknown; orcado_projetado: unknown; realizado: unknown | null; is_grupo: boolean
}

export async function getExecucao(ano: number): Promise<LinhaExecucao[]> {
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT codigo_pai, codigo, nome, mes, orcado, orcado_projetado, realizado, is_grupo
    FROM vw_execucao_mensal WHERE ano = ${ano}
    ORDER BY codigo::numeric, mes
  `
  return rows.map((r) => {
    const orcado = Number(r.orcado)
    const realizado = r.realizado === null ? null : Number(r.realizado)
    const { desvio, desvioPercentual } = calcDesvio(realizado ?? 0, orcado)
    return {
      codigoPai: r.codigo_pai, codigo: r.codigo, nome: r.nome,
      isGrupo: r.is_grupo,
      mes: r.mes, orcadoProjetado: Number(r.orcado_projetado), orcado, realizado, desvio, desvioPercentual,
    }
  })
}

function competencia(ano: number, mes: number) {
  return `${ano}-${String(mes).padStart(2, "0")}-01`
}

export async function gravarRealizado(ano: number, mes: number, contaItemId: number, valor: number) {
  const comp = competencia(ano, mes)
  await prisma.$executeRaw`
    INSERT INTO lancamento_realizado (conta_item_id, exercicio_id, competencia, valor_realizado)
    SELECT ${contaItemId}, e.id, ${comp}::date, ${valor}::numeric
    FROM exercicio e WHERE e.ano = ${ano}
    ON CONFLICT (conta_item_id, competencia)
    DO UPDATE SET valor_realizado = EXCLUDED.valor_realizado, updated_at = now()
  `
}

export async function gravarOrcado(ano: number, mes: number, contaItemId: number, valor: number) {
  const comp = competencia(ano, mes)
  await prisma.$executeRaw`
    INSERT INTO lancamento_realizado (conta_item_id, exercicio_id, competencia, valor_orcado)
    SELECT ${contaItemId}, e.id, ${comp}::date, ${valor}::numeric
    FROM exercicio e WHERE e.ano = ${ano}
    ON CONFLICT (conta_item_id, competencia)
    DO UPDATE SET valor_orcado = EXCLUDED.valor_orcado, updated_at = now()
  `
}

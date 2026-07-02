import { exigirPerfilPagina } from "@/lib/auth-server"
import { getExecucao } from "@/lib/repositories/execucao-repository"
import { getSeriesParametros } from "@/lib/repositories/parametro-repository"
import { getStatusTodos } from "@/lib/repositories/fechamento-repository"
import { montarRelatorio } from "@/lib/services/relatorio-service"
import { competenciaRef, type LinhaDash } from "@/lib/services/dashboard-service"
import { RelatorioView } from "@/components/relatorio/relatorio-view"

export default async function RelatorioPage({ searchParams }: { searchParams: Promise<{ ano?: string; mes?: string }> }) {
  await exigirPerfilPagina(["admin", "socio"])
  const { ano, mes } = await searchParams
  const anoNum = Number(ano) || new Date().getFullYear()

  const [linhasExec, series, statusTodos] = await Promise.all([
    getExecucao(anoNum),
    getSeriesParametros(anoNum),
    getStatusTodos(anoNum),
  ])

  const linhas: LinhaDash[] = linhasExec.map((l) => ({
    codigo: l.codigo, codigoPai: l.codigoPai, nome: l.nome, isGrupo: l.isGrupo,
    itemId: l.itemId, mes: l.mes, orcado: l.orcado, realizado: l.realizado,
  }))

  // Mês padrão = último mês consolidado (concluído). Sem consolidado, cai na
  // competência de referência; sem realizado, mês 12. URL (1–12) tem prioridade.
  let mesConsolidado = 0
  for (let m = 1; m <= 12; m++) if (statusTodos[m] === "concluido") mesConsolidado = m
  const ref = competenciaRef(linhas)
  const mesUrl = Number(mes)
  const mesNum = mesUrl >= 1 && mesUrl <= 12 ? mesUrl : (mesConsolidado || ref || 12)
  const status = statusTodos[mesNum] ?? "aberto"

  const payload = montarRelatorio({ ano: anoNum, mes: mesNum, linhas, series, status })
  return <RelatorioView payload={payload} />
}

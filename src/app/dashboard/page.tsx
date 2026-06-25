import { exigirPerfilPagina } from "@/lib/auth-server"
import { getExecucao } from "@/lib/repositories/execucao-repository"
import { getSeriesParametros } from "@/lib/repositories/parametro-repository"
import { listarTesouraria } from "@/lib/repositories/fechamento-repository"
import { getReceitaPorCliente } from "@/lib/repositories/dashboard-repository"
import { montarDashboard, valorVigente, type LinhaDash } from "@/lib/services/dashboard-service"
import { DashboardView } from "@/components/dashboard/dashboard-view"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ ano?: string; mes?: string }> }) {
  await exigirPerfilPagina(["admin", "socio"])
  const { ano, mes } = await searchParams
  const anoNum = Number(ano) || new Date().getFullYear()
  const mesNum = Number(mes)
  const mesSelecionado = mesNum >= 1 && mesNum <= 12 ? mesNum : null

  const [linhasExec, series, tesouraria, receitaClientes] = await Promise.all([
    getExecucao(anoNum),
    getSeriesParametros(anoNum),
    listarTesouraria(anoNum),
    getReceitaPorCliente(anoNum),
  ])

  const linhas: LinhaDash[] = linhasExec.map((l) => ({
    codigo: l.codigo, codigoPai: l.codigoPai, nome: l.nome, isGrupo: l.isGrupo,
    itemId: l.itemId,
    mes: l.mes, orcado: l.orcado, realizado: l.realizado,
  }))

  const payload = montarDashboard({
    ano: anoNum, linhas, series,
    tesouraria: tesouraria.map((e) => ({ mes: e.mes, tipo: e.tipo, valor: e.valor })),
    receitaClientes,
    saldoInicial: valorVigente(series["saldo_inicial_caixa"] ?? [], 12, 126697.96),
    caixaMinimo: valorVigente(series["caixa_minimo"] ?? [], 12, 50000),
    horasPadrao: 3200,
    mesSelecionado,
  })

  return <DashboardView payload={payload} />
}

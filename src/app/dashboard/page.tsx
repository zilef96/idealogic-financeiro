import { exigirPerfilPagina } from "@/lib/auth-server"
import { getExecucao } from "@/lib/repositories/execucao-repository"
import { getSeriesParametros } from "@/lib/repositories/parametro-repository"
import { listarTesouraria } from "@/lib/repositories/fechamento-repository"
import { getReceitaPorCliente } from "@/lib/repositories/dashboard-repository"
import { montarDashboard, valorVigente, type LinhaDash } from "@/lib/services/dashboard-service"
import { DashboardView } from "@/components/dashboard/dashboard-view"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await exigirPerfilPagina(["admin", "socio"])
  const { ano } = await searchParams
  const anoNum = Number(ano) || new Date().getFullYear()

  const [linhasExec, series, tesouraria, receitaClientes] = await Promise.all([
    getExecucao(anoNum),
    getSeriesParametros(anoNum),
    listarTesouraria(anoNum),
    getReceitaPorCliente(anoNum),
  ])

  const linhas: LinhaDash[] = linhasExec.map((l) => ({
    codigo: l.codigo, codigoPai: l.codigoPai, nome: l.nome, isGrupo: l.isGrupo,
    mes: l.mes, orcado: l.orcado, realizado: l.realizado,
  }))

  const payload = montarDashboard({
    ano: anoNum, linhas, series,
    tesouraria: tesouraria.map((e) => ({ mes: e.mes, tipo: e.tipo, valor: e.valor })),
    receitaClientes,
    saldoInicial: valorVigente(series["saldo_inicial_caixa"] ?? [], 12, 126697.96),
    caixaMinimo: valorVigente(series["caixa_minimo"] ?? [], 12, 50000),
    horasPadrao: 3200,
  })

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Dashboard Financeiro {anoNum}</h1>
      <DashboardView payload={payload} />
    </div>
  )
}

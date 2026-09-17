import { exigirPerfilPagina } from "@/lib/auth-server"
import { getExecucao } from "@/lib/repositories/execucao-repository"
import { getSeriesParametros } from "@/lib/repositories/parametro-repository"
import { getGrupos } from "@/lib/repositories/orcamento-repository"
import { listarTesouraria, getStatusTodos, getFechamentoDetalhe } from "@/lib/repositories/fechamento-repository"
import { calcularIndicadoresMes, superavitMensal, valorVigente, projecaoCaixa, type TotaisMes } from "@/lib/services/execucao-service"
import { construirTotais, temRealizadoNoMes, saldoBancarioGeralInformado } from "@/lib/services/dashboard-service"
import { AbasExecucao } from "@/components/execucao/abas-execucao"

export default async function ExecucaoPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await exigirPerfilPagina(["admin"])
  const { ano } = await searchParams
  const anoNum = Number(ano) || new Date().getFullYear()
  const [linhas, series, tesouraria, statusPorMes, grupos] = await Promise.all([
    getExecucao(anoNum),
    getSeriesParametros(anoNum),
    listarTesouraria(anoNum),
    getStatusTodos(anoNum),
    getGrupos(anoNum),
  ])
  const mesAtual = new Date().getMonth() + 1

  // monta os totais do mês a partir do campo "orcado" ou "realizado"
  const totaisDe = (campo: "orcado" | "realizado") => (mes: number): TotaisMes =>
    construirTotais(linhas, campo, mes)
  const totaisReal = totaisDe("realizado")
  const totaisOrc = totaisDe("orcado")

  const aplic = (mes: number) => tesouraria.filter((e) => e.mes === mes && e.tipo === "aplicacao").reduce((s, e) => s + e.valor, 0)
  const resg = (mes: number) => tesouraria.filter((e) => e.mes === mes && e.tipo === "resgate").reduce((s, e) => s + e.valor, 0)
  const meses = Array.from({ length: 12 }, (_, i) => i + 1)
  const saldoInicial = valorVigente(series["saldo_inicial_caixa"] ?? [], 12, 126697.96)
  const projDe = (totaisFn: (mes: number) => TotaisMes) => projecaoCaixa({
    saldoInicial,
    superavitPorMes: meses.map((m) => superavitMensal(totaisFn(m))),
  })
  // Reancora ao saldo bancário real informado no mês (só faz sentido pro realizado —
  // orçado é projeção pura, saldo bancário é fato). Meses ainda sem realizado ficam de fora.
  const projecaoReal = projecaoCaixa({
    saldoInicial,
    superavitPorMes: meses.map((m) => superavitMensal(totaisReal(m))),
    saldosBancariosPorMes: meses.map((m) => (temRealizadoNoMes(linhas, m) ? saldoBancarioGeralInformado(series, m) : null)),
  })
  const projecaoOrc = projDe(totaisOrc)

  const parametrosDe = (mes: number) => ({
    horasFaturaveis: valorVigente(series["horas_faturaveis"] ?? [], mes, 3200),
    fatorReajuste: valorVigente(series["fator_reajuste"] ?? [], mes, 1),
  })
  const indicadoresRealizadoPorMes = meses.map((mes) => calcularIndicadoresMes({
    totais: totaisReal(mes), parametros: parametrosDe(mes),
    tesouraria: { aplicacoes: aplic(mes), resgates: resg(mes) },
    caixaDoMes: projecaoReal[mes - 1],
    temRealizado: linhas.some((l) => l.mes === mes && l.realizado != null),
  }))
  const indicadoresOrcadoPorMes = meses.map((mes) => calcularIndicadoresMes({
    totais: totaisOrc(mes), parametros: parametrosDe(mes),
    tesouraria: { aplicacoes: aplic(mes), resgates: resg(mes) },
    caixaDoMes: projecaoOrc[mes - 1],
    temRealizado: true,
  }))

  const detalhes = await Promise.all(meses.map((m) => getFechamentoDetalhe(anoNum, m)))
  const auditoriaPorMes = Object.fromEntries(meses.map((m, i) => [m, detalhes[i]]))

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Execução Orçamentária {anoNum}</h1>
      <AbasExecucao ano={anoNum} mesAtual={mesAtual} linhas={linhas} series={series}
        statusPorMes={statusPorMes} grupos={grupos} auditoriaPorMes={auditoriaPorMes}
        indicadoresOrcadoPorMes={indicadoresOrcadoPorMes}
        indicadoresRealizadoPorMes={indicadoresRealizadoPorMes} />
    </div>
  )
}

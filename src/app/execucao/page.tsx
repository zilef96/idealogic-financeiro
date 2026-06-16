import { exigirPerfilPagina } from "@/lib/auth-server"
import { getExecucao } from "@/lib/repositories/execucao-repository"
import { getSeriesParametros } from "@/lib/repositories/parametro-repository"
import { listarTesouraria } from "@/lib/repositories/fechamento-repository"
import { calcularIndicadoresMes, superavitMensal, valorVigente, projecaoCaixa, type TotaisMes } from "@/lib/services/execucao-service"
import { AbasExecucao } from "@/components/execucao/abas-execucao"

export default async function ExecucaoPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await exigirPerfilPagina(["admin"])
  const { ano } = await searchParams
  const anoNum = Number(ano) || new Date().getFullYear()
  const [linhas, series, tesouraria] = await Promise.all([
    getExecucao(anoNum),
    getSeriesParametros(anoNum),
    listarTesouraria(anoNum),
  ])
  const mesAtual = new Date().getMonth() + 1

  const tot = (cod: string, mes: number) =>
    linhas.find((l) => l.codigo === cod && l.mes === mes && l.isGrupo)?.realizado ?? 0
  const totaisMes = (mes: number): TotaisMes => ({
    faturamento: tot("10000", mes), tributosFat: tot("10900", mes),
    custos: tot("20000", mes), despesas: tot("30000", mes), dividendos: tot("40000", mes),
    custosOperacionais: tot("33000", mes),
    despAdmFinComl: tot("31000", mes) + tot("32000", mes) + tot("33000", mes) + tot("34000", mes),
  })

  const aplic = (mes: number) => tesouraria.filter((e) => e.mes === mes && e.tipo === "aplicacao").reduce((s, e) => s + e.valor, 0)
  const resg = (mes: number) => tesouraria.filter((e) => e.mes === mes && e.tipo === "resgate").reduce((s, e) => s + e.valor, 0)
  const meses = Array.from({ length: 12 }, (_, i) => i + 1)
  const projecao = projecaoCaixa({
    saldoInicial: valorVigente(series["saldo_inicial_caixa"] ?? [], 12, 126697.96),
    superavitPorMes: meses.map((m) => superavitMensal(totaisMes(m))),
    aplicacoesPorMes: meses.map(aplic),
    resgatesPorMes: meses.map(resg),
  })

  const indicadoresPorMes = meses.map((mes) => calcularIndicadoresMes({
    totais: totaisMes(mes),
    parametros: {
      pis: valorVigente(series["aliquota_pis"] ?? [], mes, 0),
      cofins: valorVigente(series["aliquota_cofins"] ?? [], mes, 0),
      issqn: valorVigente(series["aliquota_issqn"] ?? [], mes, 0),
      horasFaturaveis: valorVigente(series["horas_faturaveis"] ?? [], mes, 3200),
      fatorReajuste: valorVigente(series["fator_reajuste"] ?? [], mes, 1),
    },
    tesouraria: { aplicacoes: aplic(mes), resgates: resg(mes) },
    caixaDoMes: projecao[mes - 1],
    temRealizado: linhas.some((l) => l.mes === mes && l.realizado != null),
  }))

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Execução Orçamentária {anoNum}</h1>
      <AbasExecucao ano={anoNum} mesAtual={mesAtual} linhas={linhas} indicadoresPorMes={indicadoresPorMes} projecao={projecao} />
    </div>
  )
}

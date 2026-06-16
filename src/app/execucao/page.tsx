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

  const grupo = (cod: string, mes: number) => linhas.find((l) => l.codigo === cod && l.mes === mes && l.isGrupo)
  // monta os totais do mês a partir do campo "orcado" ou "realizado"
  const totaisDe = (campo: "orcado" | "realizado") => (mes: number): TotaisMes => {
    const v = (cod: string) => (campo === "orcado" ? grupo(cod, mes)?.orcado : grupo(cod, mes)?.realizado) ?? 0
    return {
      faturamento: v("10000"), tributosFat: v("10200"),
      custos: v("20000"), despesas: v("30000"), dividendos: v("40000"),
      custosOperacionais: v("33000"),
      despAdmFinComl: v("31000") + v("32000") + v("33000") + v("34000"),
    }
  }
  const totaisReal = totaisDe("realizado")
  const totaisOrc = totaisDe("orcado")

  const aplic = (mes: number) => tesouraria.filter((e) => e.mes === mes && e.tipo === "aplicacao").reduce((s, e) => s + e.valor, 0)
  const resg = (mes: number) => tesouraria.filter((e) => e.mes === mes && e.tipo === "resgate").reduce((s, e) => s + e.valor, 0)
  const meses = Array.from({ length: 12 }, (_, i) => i + 1)
  const saldoInicial = valorVigente(series["saldo_inicial_caixa"] ?? [], 12, 126697.96)
  const projDe = (totaisFn: (mes: number) => TotaisMes) => projecaoCaixa({
    saldoInicial,
    superavitPorMes: meses.map((m) => superavitMensal(totaisFn(m))),
    aplicacoesPorMes: meses.map(aplic),
    resgatesPorMes: meses.map(resg),
  })
  const projecaoReal = projDe(totaisReal)
  const projecaoOrc = projDe(totaisOrc)

  const parametrosDe = (mes: number) => ({
    pis: valorVigente(series["aliquota_pis"] ?? [], mes, 0),
    cofins: valorVigente(series["aliquota_cofins"] ?? [], mes, 0),
    issqn: valorVigente(series["aliquota_issqn"] ?? [], mes, 0),
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

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Execução Orçamentária {anoNum}</h1>
      <AbasExecucao ano={anoNum} mesAtual={mesAtual} linhas={linhas}
        indicadoresMes={indicadoresRealizadoPorMes[mesAtual - 1] ?? []}
        indicadoresOrcadoPorMes={indicadoresOrcadoPorMes}
        indicadoresRealizadoPorMes={indicadoresRealizadoPorMes} />
    </div>
  )
}

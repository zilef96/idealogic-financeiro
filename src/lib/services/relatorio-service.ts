import {
  type LinhaDash, type SeriesParametros, type TotaisMes,
  construirTotais, faturamentoServicos, superavitMensal, margemContribuicao,
  competenciaRef, serieTributos, MESES,
} from "@/lib/services/dashboard-service"

// Total de Receitas = fat. de serviços + cotas. Tributos (3 itens) = grupo 10200 − CSLL/IRPJ (10204).
export function receitaLiquida(totais: TotaisMes): number {
  const totalReceitas = faturamentoServicos(totais) + totais.cotas
  const tributos3 = totais.tributosFat - totais.tributacaoLucro
  return totalReceitas - tributos3
}

// Margem Bruta (%) = (Receita Líquida − Custos) / Receita Líquida × 100.
export function margemBruta(receitaLiquida: number, custos: number): number | null {
  if (receitaLiquida === 0) return null
  return ((receitaLiquida - custos) / receitaLiquida) * 100
}

export interface DemonstrativoCustos {
  remuneracao: number               // 20100 + 20200 + 20300
  tributosEncargosProvisoes: number // 20400
  beneficios: number                // 20500
  total: number                     // 20000 (rollup)
}

// Realizado de um grupo (por código) no mês; 0 quando ausente ou nulo.
function valorGrupoMes(linhas: LinhaDash[], codigo: string, mes: number): number {
  const l = linhas.find((x) => x.isGrupo && x.codigo === codigo && x.mes === mes)
  return l?.realizado ?? 0
}

export function demonstrativoCustos(linhas: LinhaDash[], mes: number): DemonstrativoCustos {
  const g = (cod: string) => valorGrupoMes(linhas, cod, mes)
  return {
    remuneracao: g("20100") + g("20200") + g("20300"),
    tributosEncargosProvisoes: g("20400"),
    beneficios: g("20500"),
    total: g("20000"),
  }
}

export interface DemonstrativoDespesas {
  remuneracao: number         // 31000
  culturaPessoas: number      // 32000
  custosOperacionais: number  // 33000
  cloud: number               // 33100
  saas: number                // 33200
  assessorias: number         // 33300
  despesasFinanceiras: number // 34000
  marketingSocial: number     // 35100
  marketingComercial: number  // 35200
  espacoGauten: number        // 36000
  total: number               // 30000 (rollup)
}

export function demonstrativoDespesas(linhas: LinhaDash[], mes: number): DemonstrativoDespesas {
  const g = (cod: string) => valorGrupoMes(linhas, cod, mes)
  return {
    remuneracao: g("31000"),
    culturaPessoas: g("32000"),
    custosOperacionais: g("33000"),
    cloud: g("33100"),
    saas: g("33200"),
    assessorias: g("33300"),
    despesasFinanceiras: g("34000"),
    marketingSocial: g("35100"),
    marketingComercial: g("35200"),
    espacoGauten: g("36000"),
    total: g("30000"),
  }
}

export interface SaldosBancarios {
  sicrediCc: number
  sicrediAplicacao: number
  banrisulCc: number
  saldoGeral: number
}

export function saldosBancarios(series: SeriesParametros, mes: number): SaldosBancarios {
  const ler = (chave: string) => series[chave]?.find((s) => s.mes === mes)?.valor ?? 0
  const sicrediCc = ler("saldo_sicredi_cc")
  const sicrediAplicacao = ler("saldo_sicredi_aplicacao")
  const banrisulCc = ler("saldo_banrisul_cc")
  return { sicrediCc, sicrediAplicacao, banrisulCc, saldoGeral: sicrediCc + sicrediAplicacao + banrisulCc }
}

export interface LinhaFluxo {
  receitas: number; cotas: number; tributos: number
  custos: number; despesas: number; dividendos: number; resultado: number
}
export interface PontoFluxoGrafico {
  mes: number
  receitas: number | null; cotas: number | null; tributos: number | null
  custos: number | null; despesas: number | null
}
export interface FluxoMensal {
  meses: (LinhaFluxo & { mes: number })[]
  total: LinhaFluxo
  grafico: PontoFluxoGrafico[]
}

export function serieFluxoMensal(linhas: LinhaDash[]): FluxoMensal {
  const ref = competenciaRef(linhas)
  const meses = MESES.map((mes) => {
    const t = construirTotais(linhas, "realizado", mes)
    return {
      mes,
      receitas: faturamentoServicos(t),
      cotas: t.cotas,
      tributos: t.tributosFat - t.tributacaoLucro,
      custos: t.custos,
      despesas: t.despesas,
      dividendos: t.dividendos,
      resultado: superavitMensal(t),
    }
  })
  const total = meses.reduce<LinhaFluxo>((acc, m) => ({
    receitas: acc.receitas + m.receitas,
    cotas: acc.cotas + m.cotas,
    tributos: acc.tributos + m.tributos,
    custos: acc.custos + m.custos,
    despesas: acc.despesas + m.despesas,
    dividendos: acc.dividendos + m.dividendos,
    resultado: acc.resultado + m.resultado,
  }), { receitas: 0, cotas: 0, tributos: 0, custos: 0, despesas: 0, dividendos: 0, resultado: 0 })
  const grafico: PontoFluxoGrafico[] = meses.map((m) =>
    m.mes <= ref
      ? { mes: m.mes, receitas: m.receitas, cotas: m.cotas, tributos: m.tributos, custos: m.custos, despesas: m.despesas }
      : { mes: m.mes, receitas: null, cotas: null, tributos: null, custos: null, despesas: null })
  return { meses, total, grafico }
}

export type StatusRelatorio = "aberto" | "concluido"

export interface RelatorioInput {
  ano: number
  mes: number
  linhas: LinhaDash[]
  series: SeriesParametros
  status: StatusRelatorio
}

export interface RelatorioPayload {
  ano: number
  mes: number
  status: StatusRelatorio
  // Demonstrativos
  faturamento: number
  cotas: number
  totalReceitas: number
  pis: number
  cofins: number
  issqn: number
  receitaLiquida: number
  custos: DemonstrativoCustos
  despesas: DemonstrativoDespesas
  dividendos: number
  // Indicadores
  resultadoOperacional: number
  margemBruta: number | null
  margemLiquida: number | null
  saldos: SaldosBancarios
  // Fluxo
  fluxo: FluxoMensal
}

export function montarRelatorio(input: RelatorioInput): RelatorioPayload {
  const { ano, mes, linhas, series, status } = input
  const t = construirTotais(linhas, "realizado", mes)
  const fat = faturamentoServicos(t)
  const rl = receitaLiquida(t)
  const custos = demonstrativoCustos(linhas, mes)
  const resultadoOperacional = superavitMensal(t)
  const trib = serieTributos(linhas)[mes - 1]
  return {
    ano, mes, status,
    faturamento: fat,
    cotas: t.cotas,
    totalReceitas: fat + t.cotas,
    pis: trib?.pis ?? 0,
    cofins: trib?.cofins ?? 0,
    issqn: trib?.issqn ?? 0,
    receitaLiquida: rl,
    custos,
    despesas: demonstrativoDespesas(linhas, mes),
    dividendos: t.dividendos,
    resultadoOperacional,
    margemBruta: margemBruta(rl, custos.total),
    margemLiquida: margemContribuicao(resultadoOperacional, rl),
    saldos: saldosBancarios(series, mes),
    fluxo: serieFluxoMensal(linhas),
  }
}

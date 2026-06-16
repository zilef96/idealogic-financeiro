import {
  type TotaisMes, faturamentoServicos, superavitMensal, margemContribuicao,
  custoHora, calcDesvio, projecaoCaixa, valorVigente, type FormatoIndicador,
} from "@/lib/services/execucao-service"
import type { ReceitaCliente } from "@/lib/repositories/dashboard-repository"

// Subconjunto de LinhaExecucao que o dashboard consome (type-only; sem I/O).
export interface LinhaDash {
  codigo: string
  codigoPai: string
  nome: string
  isGrupo: boolean
  mes: number
  orcado: number
  realizado: number | null
}

export type Campo = "orcado" | "realizado"

export function construirTotais(linhas: LinhaDash[], campo: Campo, mes: number): TotaisMes {
  const val = (cod: string, grupo: boolean) => {
    const l = linhas.find((x) => x.codigo === cod && x.mes === mes && x.isGrupo === grupo)
    if (!l) return 0
    return (campo === "orcado" ? l.orcado : l.realizado) ?? 0
  }
  const vg = (cod: string) => val(cod, true)
  const vi = (cod: string) => val(cod, false)
  return {
    faturamento: vg("10000"), cotas: vg("10100"), tributosFat: vg("10200"), tributacaoLucro: vi("10204"),
    custos: vg("20000"), despesas: vg("30000"), dividendos: vg("40000"),
    custosOperacionais: vg("33000"),
    despAdmFinComl: vg("31000") + vg("32000") + vg("33000") + vg("34000"),
  }
}

export function temRealizadoNoMes(linhas: LinhaDash[], mes: number): boolean {
  return linhas.some((l) => l.mes === mes && l.realizado != null)
}

export function competenciaRef(linhas: LinhaDash[]): number {
  let ref = 0
  for (let m = 1; m <= 12; m++) if (temRealizadoNoMes(linhas, m)) ref = m
  return ref
}

const MESES = Array.from({ length: 12 }, (_, i) => i + 1)

export interface PontoOrcadoRealizado {
  mes: number; orcado: number; realizado: number | null
  desvioPercentual: number | null; pendente: boolean
}

export function serieOrcadoRealizado(linhas: LinhaDash[]): PontoOrcadoRealizado[] {
  return MESES.map((mes) => {
    const pend = !temRealizadoNoMes(linhas, mes)
    const orcado = faturamentoServicos(construirTotais(linhas, "orcado", mes))
    const realizado = pend ? null : faturamentoServicos(construirTotais(linhas, "realizado", mes))
    const { desvioPercentual } = calcDesvio(realizado ?? 0, orcado)
    return { mes, orcado, realizado, desvioPercentual: pend ? null : desvioPercentual, pendente: pend }
  })
}

export interface PontoSuperavit {
  mes: number; superavit: number | null; acumulado: number | null; pendente: boolean
}

export function serieSuperavit(linhas: LinhaDash[]): PontoSuperavit[] {
  let acc = 0
  return MESES.map((mes) => {
    const pend = !temRealizadoNoMes(linhas, mes)
    if (pend) return { mes, superavit: null, acumulado: null, pendente: true }
    const superavit = superavitMensal(construirTotais(linhas, "realizado", mes))
    acc += superavit
    return { mes, superavit, acumulado: acc, pendente: false }
  })
}

export interface PontoMargem { mes: number; margem: number | null; pendente: boolean }

export function serieMargem(linhas: LinhaDash[]): PontoMargem[] {
  return MESES.map((mes) => {
    const pend = !temRealizadoNoMes(linhas, mes)
    if (pend) return { mes, margem: null, pendente: true }
    const t = construirTotais(linhas, "realizado", mes)
    return { mes, margem: margemContribuicao(superavitMensal(t), faturamentoServicos(t)), pendente: false }
  })
}

export type SeriesParametros = Record<string, { mes: number; valor: number }[]>

export interface PontoCustoHora { mes: number; custoHora: number | null; horas: number; pendente: boolean }

export function serieCustoHora(linhas: LinhaDash[], series: SeriesParametros, horasPadrao: number): PontoCustoHora[] {
  return MESES.map((mes) => {
    const horas = valorVigente(series["horas_faturaveis"] ?? [], mes, horasPadrao)
    const pend = !temRealizadoNoMes(linhas, mes)
    if (pend) return { mes, custoHora: null, horas, pendente: true }
    const t = construirTotais(linhas, "realizado", mes)
    return { mes, custoHora: custoHora(t.custosOperacionais, t.despAdmFinComl, horas), horas, pendente: false }
  })
}

export interface EventoTesourariaDash { mes: number; tipo: "aplicacao" | "resgate"; valor: number }
export interface PontoCaixa { mes: number; saldo: number; projetado: boolean }

export function serieCaixa(
  linhas: LinhaDash[], tesouraria: EventoTesourariaDash[], saldoInicial: number, caixaMinimo: number,
): { pontos: PontoCaixa[]; caixaMinimo: number } {
  const soma = (mes: number, tipo: "aplicacao" | "resgate") =>
    tesouraria.filter((e) => e.mes === mes && e.tipo === tipo).reduce((s, e) => s + e.valor, 0)
  const projetadoPorMes = MESES.map((m) => !temRealizadoNoMes(linhas, m))
  const superavitPorMes = MESES.map((m) =>
    superavitMensal(construirTotais(linhas, projetadoPorMes[m - 1] ? "orcado" : "realizado", m)))
  const saldos = projecaoCaixa({
    saldoInicial,
    superavitPorMes,
    aplicacoesPorMes: MESES.map((m) => soma(m, "aplicacao")),
    resgatesPorMes: MESES.map((m) => soma(m, "resgate")),
  })
  return { pontos: MESES.map((m) => ({ mes: m, saldo: saldos[m - 1], projetado: projetadoPorMes[m - 1] })), caixaMinimo }
}

export interface PontoTributo {
  mes: number; pis: number | null; cofins: number | null; issqn: number | null
  cargaPercentual: number | null; pendente: boolean
}

export function serieTributos(linhas: LinhaDash[]): PontoTributo[] {
  const itemReal = (cod: string, mes: number) =>
    linhas.find((l) => l.codigo === cod && l.mes === mes && !l.isGrupo)?.realizado ?? 0
  return MESES.map((mes) => {
    const pend = !temRealizadoNoMes(linhas, mes)
    if (pend) return { mes, pis: null, cofins: null, issqn: null, cargaPercentual: null, pendente: true }
    const pis = itemReal("10201", mes), cofins = itemReal("10202", mes), issqn = itemReal("10203", mes)
    const fat = faturamentoServicos(construirTotais(linhas, "realizado", mes))
    const carga = fat === 0 ? null : ((pis + cofins + issqn) / fat) * 100
    return { mes, pis, cofins, issqn, cargaPercentual: carga, pendente: false }
  })
}

export interface CategoriaNode {
  codigo: string; nome: string; tipo: "R" | "C" | "D" | "E" | "?"; valor: number; filhos: CategoriaNode[]
}

function tipoPorCodigo(codigo: string): CategoriaNode["tipo"] {
  switch (codigo[0]) { case "1": return "R"; case "2": return "C"; case "3": return "D"; case "4": return "E"; default: return "?" }
}

export function arvoreCategorias(linhas: LinhaDash[]): CategoriaNode[] {
  // Acumula realizado no ano por código (mantém nome/pai/isGrupo do primeiro encontro).
  const acc = new Map<string, { nome: string; pai: string; isGrupo: boolean; valor: number }>()
  for (const l of linhas) {
    const e = acc.get(l.codigo) ?? { nome: l.nome, pai: l.codigoPai, isGrupo: l.isGrupo, valor: 0 }
    e.valor += l.realizado ?? 0
    acc.set(l.codigo, e)
  }
  const nodes = new Map<string, CategoriaNode>()
  for (const [codigo, e] of acc) nodes.set(codigo, { codigo, nome: e.nome, tipo: tipoPorCodigo(codigo), valor: e.valor, filhos: [] })
  const raizes: CategoriaNode[] = []
  for (const [codigo, e] of acc) {
    const node = nodes.get(codigo)!
    const pai = e.pai && nodes.get(e.pai)
    if (pai) pai.filhos.push(node)
    else raizes.push(node)
  }
  // Rollup: o valor de um grupo é a soma das folhas descendentes (evita dupla contagem
  // com o total já pré-agregado das linhas de grupo na vw_execucao_mensal).
  const rollup = (n: CategoriaNode): number => {
    if (n.filhos.length === 0) return n.valor
    n.valor = n.filhos.reduce((s, f) => s + rollup(f), 0)
    return n.valor
  }
  raizes.forEach(rollup)
  const ordena = (ns: CategoriaNode[]) => { ns.sort((a, b) => a.codigo.localeCompare(b.codigo)); ns.forEach((n) => ordena(n.filhos)) }
  ordena(raizes)
  return raizes
}

export function topDespesas(linhas: LinhaDash[], n: number): { nome: string; valor: number }[] {
  const acc = new Map<string, number>()
  for (const l of linhas) {
    if (l.isGrupo || l.codigo[0] !== "3") continue
    acc.set(l.nome, (acc.get(l.nome) ?? 0) + (l.realizado ?? 0))
  }
  return [...acc.entries()].map(([nome, valor]) => ({ nome, valor }))
    .filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, n)
}

export interface ClientePareto { codigo: string; nome: string; receita: number; percentual: number; acumulado: number }

export function paretoClientes(clientes: ReceitaCliente[]): ClientePareto[] {
  const ordenado = [...clientes].sort((a, b) => b.realizado - a.realizado)
  const total = ordenado.reduce((s, c) => s + c.realizado, 0)
  let acc = 0
  return ordenado.map((c) => {
    const percentual = total === 0 ? 0 : (c.realizado / total) * 100
    acc += percentual
    return { codigo: c.codigo, nome: c.nome, receita: c.realizado, percentual, acumulado: total === 0 ? 0 : acc }
  })
}

export interface KpiDelta { rotulo: string; valor: number | null; formato: "percent" | "pontos" | "moeda" | "numero"; inverted: boolean }
export interface Kpi { id: string; rotulo: string; valor: number | null; formato: FormatoIndicador; deltas: KpiDelta[]; pendente: boolean }

type SerieCaixaResult = { pontos: PontoCaixa[]; caixaMinimo: number }
const pct = (novo: number, base: number): number | null => (base === 0 ? null : ((novo - base) / Math.abs(base)) * 100)
const TOLERANCIA = 5

// Soma os TotaisMes de janeiro até `ateMes` (leitura YTD). As funções puras
// (faturamentoServicos, superavitMensal) são lineares, então valem sobre a soma.
export function totaisAcumulados(linhas: LinhaDash[], campo: Campo, ateMes: number): TotaisMes {
  const acc: TotaisMes = {
    faturamento: 0, cotas: 0, tributosFat: 0, tributacaoLucro: 0,
    custos: 0, despesas: 0, dividendos: 0, custosOperacionais: 0, despAdmFinComl: 0,
  }
  for (let mes = 1; mes <= ateMes; mes++) {
    const t = construirTotais(linhas, campo, mes)
    acc.faturamento += t.faturamento; acc.cotas += t.cotas; acc.tributosFat += t.tributosFat
    acc.tributacaoLucro += t.tributacaoLucro; acc.custos += t.custos; acc.despesas += t.despesas
    acc.dividendos += t.dividendos; acc.custosOperacionais += t.custosOperacionais; acc.despAdmFinComl += t.despAdmFinComl
  }
  return acc
}

// KPIs do header em base YTD (acumulado de janeiro até a competência de referência).
export function montarKpis(linhas: LinhaDash[], ref: number, caixa: SerieCaixaResult): Kpi[] {
  const pend = ref === 0
  const tReal = totaisAcumulados(linhas, "realizado", ref)
  const tOrc = totaisAcumulados(linhas, "orcado", ref)
  const fatReal = faturamentoServicos(tReal), fatOrc = faturamentoServicos(tOrc)
  const supReal = superavitMensal(tReal), supOrc = superavitMensal(tOrc)
  const margemReal = margemContribuicao(supReal, fatReal)
  const saldoRef = caixa.pontos[ref - 1]?.saldo ?? 0

  // carga tributária YTD: soma de PIS/COFINS/ISSQN realizados ÷ faturamento de serviços YTD
  const trib = serieTributos(linhas)
  let pisYtd = 0, cofinsYtd = 0, issqnYtd = 0
  for (let mes = 1; mes <= ref; mes++) {
    const t = trib[mes - 1]
    if (t && !t.pendente) { pisYtd += t.pis ?? 0; cofinsYtd += t.cofins ?? 0; issqnYtd += t.issqn ?? 0 }
  }
  const cargaYtd = fatReal === 0 ? null : ((pisYtd + cofinsYtd + issqnYtd) / fatReal) * 100

  // aderência YTD: % de itens-folha de jan..ref dentro da tolerância de desvio
  const itensYtd = linhas.filter((l) => !l.isGrupo && l.mes <= ref && l.realizado != null)
  const dentro = itensYtd.filter((l) => {
    const { desvioPercentual } = calcDesvio(l.realizado ?? 0, l.orcado)
    return desvioPercentual == null || Math.abs(desvioPercentual) <= TOLERANCIA
  }).length
  const fora = itensYtd.length - dentro
  const aderencia = itensYtd.length === 0 ? null : (dentro / itensYtd.length) * 100

  const m = (v: number | null): number | null => (pend ? null : v)
  return [
    { id: "faturamento", rotulo: "Faturamento (ano)", valor: m(fatReal), formato: "moeda", pendente: pend, deltas: [
      { rotulo: "vs orçado", valor: m(pct(fatReal, fatOrc)), formato: "percent", inverted: false },
    ] },
    { id: "superavit", rotulo: "Superávit/Déficit (ano)", valor: m(supReal), formato: "moeda", pendente: pend, deltas: [
      { rotulo: "vs orçado", valor: m(pct(supReal, supOrc)), formato: "percent", inverted: false },
    ] },
    { id: "margem", rotulo: "Margem de contribuição", valor: m(margemReal), formato: "percent", pendente: pend, deltas: [] },
    { id: "caixa", rotulo: "Caixa atual", valor: saldoRef, formato: "moeda", pendente: false, deltas: [
      { rotulo: "folga vs mínimo", valor: saldoRef - caixa.caixaMinimo, formato: "moeda", inverted: false },
    ] },
    { id: "tributos", rotulo: "Carga tributária (ano)", valor: m(cargaYtd), formato: "percent", pendente: pend, deltas: [] },
    { id: "aderencia", rotulo: "Aderência ao orçamento", valor: m(aderencia), formato: "percent", pendente: pend, deltas: [
      { rotulo: "itens fora", valor: m(fora), formato: "numero", inverted: true },
    ] },
  ]
}

export interface Alerta { tipo: "caixa" | "margem" | "desvio"; mensagem: string; accordion: number }
const NOMES_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function montarAlertas(linhas: LinhaDash[], caixa: SerieCaixaResult, margem: PontoMargem[]): Alerta[] {
  const alertas: Alerta[] = []
  const rompe = caixa.pontos.find((p) => p.saldo < caixa.caixaMinimo)
  if (rompe) alertas.push({ tipo: "caixa", mensagem: `Caixa abaixo do mínimo em ${NOMES_MES[rompe.mes - 1]}`, accordion: 2 })
  const margNeg = margem.find((p) => p.margem != null && p.margem < 0)
  if (margNeg) alertas.push({ tipo: "margem", mensagem: `Margem negativa em ${NOMES_MES[margNeg.mes - 1]}`, accordion: 3 })
  return alertas
}

export interface DesvioCategoria { codigo: string; nome: string; orcado: number; realizado: number; desvioPercentual: number | null }

// Desvio orçamentário YTD por grupo de custo/despesa (filhos dos blocos 20000 e 30000).
// Soma só os meses com realizado lançado, para que orçado e realizado sejam comparáveis.
// desvioPercentual > 0 = estouro (gastou mais que o orçado).
export function desvioPorCategoria(linhas: LinhaDash[]): DesvioCategoria[] {
  const PAIS = new Set(["20000", "30000"])
  const acc = new Map<string, { nome: string; orcado: number; realizado: number }>()
  for (const l of linhas) {
    if (!l.isGrupo || !PAIS.has(l.codigoPai)) continue
    if (!temRealizadoNoMes(linhas, l.mes)) continue
    const e = acc.get(l.codigo) ?? { nome: l.nome, orcado: 0, realizado: 0 }
    e.orcado += l.orcado
    e.realizado += l.realizado ?? 0
    acc.set(l.codigo, e)
  }
  return [...acc.entries()]
    .map(([codigo, e]) => ({ codigo, nome: e.nome, orcado: e.orcado, realizado: e.realizado, desvioPercentual: calcDesvio(e.realizado, e.orcado).desvioPercentual }))
    .filter((d) => d.orcado !== 0 || d.realizado !== 0)
    .sort((a, b) => Math.abs(b.desvioPercentual ?? 0) - Math.abs(a.desvioPercentual ?? 0))
}

export interface DashboardPayload {
  ano: number
  competenciaRef: number
  kpis: Kpi[]
  alertas: Alerta[]
  desvioCategorias: DesvioCategoria[]
  orcadoRealizado: PontoOrcadoRealizado[]
  superavit: PontoSuperavit[]
  caixa: PontoCaixa[]
  caixaMinimo: number
  margem: PontoMargem[]
  custoHora: PontoCustoHora[]
  categorias: CategoriaNode[]
  topDespesas: { nome: string; valor: number }[]
  tributos: PontoTributo[]
  concentracaoClientes: ClientePareto[]
}

export function montarDashboard(input: {
  ano: number
  linhas: LinhaDash[]
  series: SeriesParametros
  tesouraria: EventoTesourariaDash[]
  receitaClientes: ReceitaCliente[]
  saldoInicial: number
  caixaMinimo: number
  horasPadrao: number
}): DashboardPayload {
  const { ano, linhas, series, tesouraria, receitaClientes, saldoInicial, caixaMinimo, horasPadrao } = input
  const caixa = serieCaixa(linhas, tesouraria, saldoInicial, caixaMinimo)
  const margem = serieMargem(linhas)
  const ref = competenciaRef(linhas)
  return {
    ano,
    competenciaRef: ref,
    kpis: montarKpis(linhas, ref, caixa),
    alertas: montarAlertas(linhas, caixa, margem),
    desvioCategorias: desvioPorCategoria(linhas),
    orcadoRealizado: serieOrcadoRealizado(linhas),
    superavit: serieSuperavit(linhas),
    caixa: caixa.pontos,
    caixaMinimo: caixa.caixaMinimo,
    margem,
    custoHora: serieCustoHora(linhas, series, horasPadrao),
    categorias: arvoreCategorias(linhas),
    topDespesas: topDespesas(linhas, 5),
    tributos: serieTributos(linhas),
    concentracaoClientes: paretoClientes(receitaClientes),
  }
}

export { MESES, faturamentoServicos, superavitMensal, margemContribuicao, custoHora, calcDesvio, projecaoCaixa, valorVigente }
export type { TotaisMes, FormatoIndicador }

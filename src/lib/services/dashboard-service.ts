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
  itemId: number | null
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
  // Item de tributo identificado pelo grupo pai (10200) + nome (item não tem mais código).
  const viNome = (codigoPai: string, nome: string) => {
    const l = linhas.find((x) => !x.isGrupo && x.codigoPai === codigoPai && x.nome === nome && x.mes === mes)
    if (!l) return 0
    return (campo === "orcado" ? l.orcado : l.realizado) ?? 0
  }
  return {
    faturamento: vg("10000"), cotas: vg("10100"), tributosFat: vg("10200"), tributacaoLucro: viNome("10200", "CSLL e IRPJ"),
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
  const projetadoPorMes = MESES.map((m) => !temRealizadoNoMes(linhas, m))
  const superavitPorMes = MESES.map((m) =>
    superavitMensal(construirTotais(linhas, projetadoPorMes[m - 1] ? "orcado" : "realizado", m)))
  const saldos = projecaoCaixa({ saldoInicial, superavitPorMes })
  return { pontos: MESES.map((m) => ({ mes: m, saldo: saldos[m - 1], projetado: projetadoPorMes[m - 1] })), caixaMinimo }
}

export interface PontoTributo {
  mes: number; pis: number | null; cofins: number | null; issqn: number | null
  cargaPercentual: number | null; pendente: boolean
}

export function serieTributos(linhas: LinhaDash[]): PontoTributo[] {
  // Tributos identificados pelo grupo pai (10200) + nome (item não tem mais código).
  const itemReal = (nome: string, mes: number) =>
    linhas.find((l) => !l.isGrupo && l.codigoPai === "10200" && l.nome === nome && l.mes === mes)?.realizado ?? 0
  return MESES.map((mes) => {
    const pend = !temRealizadoNoMes(linhas, mes)
    if (pend) return { mes, pis: null, cofins: null, issqn: null, cargaPercentual: null, pendente: true }
    const pis = itemReal("PIS", mes), cofins = itemReal("COFINS", mes), issqn = itemReal("ISSQN", mes)
    const fat = faturamentoServicos(construirTotais(linhas, "realizado", mes))
    const carga = fat === 0 ? null : ((pis + cofins + issqn) / fat) * 100
    return { mes, pis, cofins, issqn, cargaPercentual: carga, pendente: false }
  })
}

export interface CategoriaNode {
  chave: string; codigo: string; nome: string; tipo: "R" | "C" | "D" | "E" | "?"; valor: number; filhos: CategoriaNode[]
}

function tipoPorCodigo(codigo: string): CategoriaNode["tipo"] {
  switch (codigo[0]) { case "1": return "R"; case "2": return "C"; case "3": return "D"; case "4": return "E"; default: return "?" }
}

// Chave estável: grupo por código, item por id (item não tem código próprio).
function chaveDash(l: { isGrupo: boolean; codigo: string; itemId: number | null }): string {
  return l.isGrupo ? `g:${l.codigo}` : `i:${l.itemId}`
}

export function arvoreCategorias(linhas: LinhaDash[]): CategoriaNode[] {
  // Acumula realizado no ano por nó; item chaveado por id, tipo/hierarquia pelo pai (grupo).
  const acc = new Map<string, { codigo: string; nome: string; pai: string; tipoCod: string; valor: number }>()
  for (const l of linhas) {
    const k = chaveDash(l)
    const e = acc.get(k) ?? { codigo: l.codigo, nome: l.nome, pai: l.codigoPai, tipoCod: l.isGrupo ? l.codigo : l.codigoPai, valor: 0 }
    e.valor += l.realizado ?? 0
    acc.set(k, e)
  }
  const nodes = new Map<string, CategoriaNode>()
  for (const [k, e] of acc) nodes.set(k, { chave: k, codigo: e.codigo, nome: e.nome, tipo: tipoPorCodigo(e.tipoCod), valor: e.valor, filhos: [] })
  const raizes: CategoriaNode[] = []
  for (const [k, e] of acc) {
    const node = nodes.get(k)!
    const pai = e.pai ? nodes.get(`g:${e.pai}`) : undefined   // pai é sempre um grupo
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
  const ordena = (ns: CategoriaNode[]) => { ns.sort((a, b) => a.chave.localeCompare(b.chave)); ns.forEach((n) => ordena(n.filhos)) }
  ordena(raizes)
  return raizes
}

export function topDespesas(linhas: LinhaDash[], n: number): { nome: string; valor: number }[] {
  const acc = new Map<string, number>()
  for (const l of linhas) {
    if (l.isGrupo) continue
    if ((l.codigoPai[0] ?? "") !== "3") continue      // folha de despesa (bloco 3) pelo pai
    acc.set(l.nome, (acc.get(l.nome) ?? 0) + (l.realizado ?? 0))
  }
  return [...acc.entries()].map(([nome, valor]) => ({ nome, valor }))
    .filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, n)
}

export interface ClientePareto { id: number; nome: string; receita: number; percentual: number; acumulado: number }

export function paretoClientes(clientes: ReceitaCliente[]): ClientePareto[] {
  const ordenado = [...clientes].sort((a, b) => b.realizado - a.realizado)
  const total = ordenado.reduce((s, c) => s + c.realizado, 0)
  let acc = 0
  return ordenado.map((c) => {
    const percentual = total === 0 ? 0 : (c.realizado / total) * 100
    acc += percentual
    return { id: c.id, nome: c.nome, receita: c.realizado, percentual, acumulado: total === 0 ? 0 : acc }
  })
}

export interface KpiDelta { rotulo: string; valor: number | null; formato: "percent" | "pontos" | "moeda" | "numero"; inverted: boolean }
export interface Kpi {
  id: string; rotulo: string; valor: number | null; formato: FormatoIndicador
  deltas: KpiDelta[]; pendente: boolean
  referencia?: number | null      // valor de comparação (ex.: orçado) p/ subtexto "Orçado: …"
  referenciaRotulo?: string
}

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

// aderência: % de itens-folha (com realizado) dentro da tolerância de desvio, num conjunto de linhas.
function aderenciaDe(itens: LinhaDash[]): { aderencia: number | null; fora: number } {
  const dentro = itens.filter((l) => {
    const { desvioPercentual } = calcDesvio(l.realizado ?? 0, l.orcado)
    return desvioPercentual == null || Math.abs(desvioPercentual) <= TOLERANCIA
  }).length
  return { aderencia: itens.length === 0 ? null : (dentro / itens.length) * 100, fora: itens.length - dentro }
}

// KPIs em base YTD (acumulado de janeiro até a competência de referência).
function kpisYtd(linhas: LinhaDash[], ref: number, caixa: SerieCaixaResult): Kpi[] {
  const pend = ref === 0
  const tReal = totaisAcumulados(linhas, "realizado", ref)
  const tOrc = totaisAcumulados(linhas, "orcado", ref)
  const fatReal = faturamentoServicos(tReal), fatOrc = faturamentoServicos(tOrc)
  const supReal = superavitMensal(tReal), supOrc = superavitMensal(tOrc)
  const margemReal = margemContribuicao(supReal, fatReal)
  const saldoRef = caixa.pontos[ref - 1]?.saldo ?? 0

  const trib = serieTributos(linhas)
  let pisYtd = 0, cofinsYtd = 0, issqnYtd = 0
  for (let mes = 1; mes <= ref; mes++) {
    const t = trib[mes - 1]
    if (t && !t.pendente) { pisYtd += t.pis ?? 0; cofinsYtd += t.cofins ?? 0; issqnYtd += t.issqn ?? 0 }
  }
  const cargaYtd = fatReal === 0 ? null : ((pisYtd + cofinsYtd + issqnYtd) / fatReal) * 100
  const { aderencia, fora } = aderenciaDe(linhas.filter((l) => !l.isGrupo && l.mes <= ref && l.realizado != null))

  const m = (v: number | null): number | null => (pend ? null : v)
  return [
    { id: "faturamento", rotulo: "Faturamento (ano)", valor: m(fatReal), formato: "moeda", pendente: pend, referencia: m(fatOrc), referenciaRotulo: "Orçado", deltas: [
      { rotulo: "vs orçado", valor: m(pct(fatReal, fatOrc)), formato: "percent", inverted: false },
    ] },
    { id: "superavit", rotulo: "Superávit/Déficit (ano)", valor: m(supReal), formato: "moeda", pendente: pend, referencia: m(supOrc), referenciaRotulo: "Orçado", deltas: [
      { rotulo: "vs orçado", valor: m(pct(supReal, supOrc)), formato: "percent", inverted: false },
    ] },
    { id: "margem", rotulo: "Margem de contribuição", valor: m(margemReal), formato: "percent", pendente: pend, deltas: [] },
    { id: "caixa", rotulo: "Caixa atual", valor: saldoRef, formato: "moeda", pendente: false, referencia: caixa.caixaMinimo, referenciaRotulo: "Mínimo", deltas: [
      { rotulo: "folga vs mínimo", valor: saldoRef - caixa.caixaMinimo, formato: "moeda", inverted: false },
    ] },
    { id: "tributos", rotulo: "Carga tributária (ano)", valor: m(cargaYtd), formato: "percent", pendente: pend, deltas: [] },
    { id: "aderencia", rotulo: "Aderência ao orçamento", valor: m(aderencia), formato: "percent", pendente: pend, deltas: [
      { rotulo: "itens fora", valor: m(fora), formato: "numero", inverted: true },
    ] },
  ]
}

// KPIs de um único mês (point-in-month), com deltas vs orçado e vs mês anterior.
function kpisMes(linhas: LinhaDash[], mes: number, caixa: SerieCaixaResult): Kpi[] {
  const pend = !temRealizadoNoMes(linhas, mes)
  const tReal = construirTotais(linhas, "realizado", mes)
  const tOrc = construirTotais(linhas, "orcado", mes)
  const fatReal = faturamentoServicos(tReal), fatOrc = faturamentoServicos(tOrc)
  const fatAnt = mes > 1 ? faturamentoServicos(construirTotais(linhas, "realizado", mes - 1)) : 0
  const supReal = superavitMensal(tReal), supOrc = superavitMensal(tOrc)
  const margemReal = margemContribuicao(supReal, fatReal)
  const carga = serieTributos(linhas)[mes - 1]?.cargaPercentual ?? null
  const saldo = caixa.pontos[mes - 1]?.saldo ?? 0
  const { aderencia, fora } = aderenciaDe(linhas.filter((l) => !l.isGrupo && l.mes === mes && l.realizado != null))

  const m = (v: number | null): number | null => (pend ? null : v)
  return [
    { id: "faturamento", rotulo: "Faturamento", valor: m(fatReal), formato: "moeda", pendente: pend, referencia: fatOrc, referenciaRotulo: "Orçado", deltas: [
      { rotulo: "vs orçado", valor: m(pct(fatReal, fatOrc)), formato: "percent", inverted: false },
      { rotulo: "vs mês ant.", valor: m(pct(fatReal, fatAnt)), formato: "percent", inverted: false },
    ] },
    { id: "superavit", rotulo: "Superávit/Déficit", valor: m(supReal), formato: "moeda", pendente: pend, referencia: supOrc, referenciaRotulo: "Orçado", deltas: [
      { rotulo: "vs orçado", valor: m(pct(supReal, supOrc)), formato: "percent", inverted: false },
    ] },
    { id: "margem", rotulo: "Margem de contribuição", valor: m(margemReal), formato: "percent", pendente: pend, deltas: [] },
    { id: "caixa", rotulo: "Caixa no mês", valor: m(saldo), formato: "moeda", pendente: pend, referencia: caixa.caixaMinimo, referenciaRotulo: "Mínimo", deltas: [
      { rotulo: "folga vs mínimo", valor: m(saldo - caixa.caixaMinimo), formato: "moeda", inverted: false },
    ] },
    { id: "tributos", rotulo: "Carga tributária", valor: m(carga), formato: "percent", pendente: pend, deltas: [] },
    { id: "aderencia", rotulo: "Aderência ao orçamento", valor: m(aderencia), formato: "percent", pendente: pend, deltas: [
      { rotulo: "itens fora", valor: m(fora), formato: "numero", inverted: true },
    ] },
  ]
}

// `mesSelecionado` null/ausente → visão do ano (YTD); 1–12 → visão do mês escolhido.
export function montarKpis(linhas: LinhaDash[], ref: number, caixa: SerieCaixaResult, mesSelecionado?: number | null): Kpi[] {
  return mesSelecionado == null ? kpisYtd(linhas, ref, caixa) : kpisMes(linhas, mesSelecionado, caixa)
}

export interface Alerta { tipo: "caixa" | "margem" | "desvio"; nivel: "critico" | "atencao"; mensagem: string }
const NOMES_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export interface LimitesAlerta {
  margemMeta?: number   // % de margem abaixo do qual já se avisa (padrão 15)
  folgaCaixa?: number   // fração acima do mínimo que ainda gera atenção (padrão 0,2 = 20%)
  desvioTol?: number    // % de estouro de um grupo que gera atenção (padrão 10)
}

// Alertas preventivos: além de "já estourou" (crítico), avisam quando algo se
// aproxima do limite (atenção). Olham os 12 meses (inclui projeção).
export function montarAlertas(
  caixa: SerieCaixaResult,
  margem: PontoMargem[],
  desvioCategorias: DesvioCategoria[] = [],
  limites: LimitesAlerta = {},
): Alerta[] {
  const margemMeta = limites.margemMeta ?? 15
  const folgaCaixa = limites.folgaCaixa ?? 0.2
  const desvioTol = limites.desvioTol ?? 10
  const alertas: Alerta[] = []

  // Caixa: crítico se rompe o mínimo; atenção se a folga fica abaixo de `folgaCaixa`.
  const rompe = caixa.pontos.find((p) => p.saldo < caixa.caixaMinimo)
  const aperta = caixa.pontos.find((p) => p.saldo < caixa.caixaMinimo * (1 + folgaCaixa))
  if (rompe) alertas.push({ tipo: "caixa", nivel: "critico", mensagem: `Caixa abaixo do mínimo em ${NOMES_MES[rompe.mes - 1]}` })
  else if (aperta) alertas.push({ tipo: "caixa", nivel: "atencao", mensagem: `Caixa com pouca folga em ${NOMES_MES[aperta.mes - 1]} (a menos de ${Math.round(folgaCaixa * 100)}% do mínimo)` })

  // Margem: crítico se negativa; atenção se abaixo da meta.
  const margNeg = margem.find((p) => p.margem != null && p.margem < 0)
  const margBaixa = margem.find((p) => p.margem != null && p.margem >= 0 && p.margem < margemMeta)
  if (margNeg) alertas.push({ tipo: "margem", nivel: "critico", mensagem: `Margem negativa em ${NOMES_MES[margNeg.mes - 1]}` })
  else if (margBaixa) alertas.push({ tipo: "margem", nivel: "atencao", mensagem: `Margem abaixo de ${margemMeta}% em ${NOMES_MES[margBaixa.mes - 1]}` })

  // Desvio: atenção quando algum grupo estoura o orçado além da tolerância.
  const estouro = desvioCategorias
    .filter((d) => (d.desvioPercentual ?? 0) > desvioTol)
    .sort((a, b) => (b.desvioPercentual ?? 0) - (a.desvioPercentual ?? 0))[0]
  if (estouro) alertas.push({ tipo: "desvio", nivel: "atencao", mensagem: `${estouro.nome} estourou o orçado em ${Math.round(estouro.desvioPercentual ?? 0)}%` })

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
  mesSelecionado: number | null   // null = visão do ano (YTD); 1–12 = mês escolhido
  faturamentoYtd: number          // faturamento de serviços acumulado no ano (para o cabeçalho)
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
  mesSelecionado?: number | null
}): DashboardPayload {
  const { ano, linhas, series, tesouraria, receitaClientes, saldoInicial, caixaMinimo, horasPadrao } = input
  const mesSelecionado = input.mesSelecionado ?? null
  const caixa = serieCaixa(linhas, tesouraria, saldoInicial, caixaMinimo)
  const margem = serieMargem(linhas)
  const desvioCategorias = desvioPorCategoria(linhas)
  const ref = competenciaRef(linhas)
  return {
    ano,
    competenciaRef: ref,
    mesSelecionado,
    faturamentoYtd: faturamentoServicos(totaisAcumulados(linhas, "realizado", ref)),
    kpis: montarKpis(linhas, ref, caixa, mesSelecionado),
    alertas: montarAlertas(caixa, margem, desvioCategorias),
    desvioCategorias,
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

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

export { MESES, faturamentoServicos, superavitMensal, margemContribuicao, custoHora, calcDesvio, projecaoCaixa, valorVigente }
export type { TotaisMes, FormatoIndicador }

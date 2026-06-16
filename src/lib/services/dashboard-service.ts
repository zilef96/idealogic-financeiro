import {
  type TotaisMes, faturamentoServicos, superavitMensal, margemContribuicao,
  custoHora, calcDesvio, projecaoCaixa, valorVigente, type FormatoIndicador,
} from "@/lib/services/execucao-service"

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
export { MESES, faturamentoServicos, superavitMensal, margemContribuicao, custoHora, calcDesvio, projecaoCaixa, valorVigente }
export type { TotaisMes, FormatoIndicador }

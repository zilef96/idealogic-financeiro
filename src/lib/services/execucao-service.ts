export function calcDesvio(realizado: number, orcado: number) {
  const desvio = realizado - orcado
  return { desvio, desvioPercentual: orcado === 0 ? null : (desvio / orcado) * 100 }
}

export function margemContribuicao(superavit: number, faturamento: number): number | null {
  if (faturamento === 0) return null
  return (superavit / faturamento) * 100
}

export function custoHora(custosOperacionais: number, despesasAdm: number, horas: number): number | null {
  if (horas === 0) return null
  return (custosOperacionais + despesasAdm) / horas
}

export function tributosSobreFaturamento(
  receitaRealizada: number,
  aliquotas: { pis: number; cofins: number; issqn: number },
): number {
  return receitaRealizada * (aliquotas.pis + aliquotas.cofins + aliquotas.issqn)
}

export function valorVigente(
  serie: { mes: number; valor: number }[],
  mes: number,
  padrao = 0,
): number {
  let atual = padrao
  let melhorMes = -1
  for (const s of serie) {
    if (s.mes <= mes && s.mes > melhorMes) { atual = s.valor; melhorMes = s.mes }
  }
  return atual
}

export function projecaoCaixa(d: {
  saldoInicial: number
  superavitPorMes: number[]   // 12
  aplicacoesPorMes: number[]  // 12 (saída de caixa)
  resgatesPorMes: number[]    // 12 (entrada de caixa)
}): number[] {
  const saldo: number[] = []
  let acc = d.saldoInicial
  for (let m = 0; m < 12; m++) {
    acc += (d.superavitPorMes[m] ?? 0) - (d.aplicacoesPorMes[m] ?? 0) + (d.resgatesPorMes[m] ?? 0)
    saldo.push(acc)
  }
  return saldo
}

export interface TotaisMes {
  faturamento: number        // bloco 10000 (realizado)
  tributosFat: number        // grupo 10900 (realizado)
  custos: number             // bloco 20000
  despesas: number           // bloco 30000
  dividendos: number         // bloco 40000
  custosOperacionais: number // grupo 33000
  despAdmFinComl: number     // 31000+32000+33000+34000
}

// RN-EX-04 adaptado à hierarquia (receita líquida de tributos).
export function superavitMensal(t: TotaisMes): number {
  return (t.faturamento - t.tributosFat) - t.custos - t.despesas - t.dividendos
}

export type FormatoIndicador = "moeda" | "percent" | "numero" | "fator"
export interface Indicador { rotulo: string; valor: number | null; formato: FormatoIndicador; pendente?: boolean }
export interface ParametrosMes { pis: number; cofins: number; issqn: number; horasFaturaveis: number; fatorReajuste: number }
export interface TesourariaMes { aplicacoes: number; resgates: number }

export function calcularIndicadoresMes(input: {
  totais: TotaisMes
  parametros: ParametrosMes
  tesouraria: TesourariaMes
  caixaDoMes: number
  temRealizado: boolean
}): Indicador[] {
  const { totais: t, parametros: p, tesouraria: tes, caixaDoMes, temRealizado } = input
  const superavit = superavitMensal(t)
  const tributos = tributosSobreFaturamento(t.faturamento - t.tributosFat, {
    pis: p.pis, cofins: p.cofins, issqn: p.issqn,
  })
  const margem = margemContribuicao(superavit, t.faturamento)
  // custo hora = (31000+32000+33000+34000) / horas; 33000 já está no conjunto
  const custoH = custoHora(t.despAdmFinComl, 0, p.horasFaturaveis)
  const pend = !temRealizado
  const m = (valor: number | null): number | null => (temRealizado ? valor : null)
  return [
    { rotulo: "Superávit/Déficit", valor: m(superavit), formato: "moeda", pendente: pend },
    { rotulo: "Margem de contribuição", valor: m(margem), formato: "percent", pendente: pend },
    { rotulo: "Tributos s/ faturamento", valor: m(tributos), formato: "moeda", pendente: pend },
    { rotulo: "Custos operacionais", valor: m(t.custosOperacionais), formato: "moeda", pendente: pend },
    { rotulo: "Despesas Adm/Financ/Coml", valor: m(t.despAdmFinComl), formato: "moeda", pendente: pend },
    { rotulo: "Horas faturáveis", valor: p.horasFaturaveis, formato: "numero" },
    { rotulo: "Custo hora Idealogic", valor: m(custoH), formato: "moeda", pendente: pend },
    { rotulo: "Reajuste salarial", valor: p.fatorReajuste, formato: "fator" },
    { rotulo: "Aplicações", valor: tes.aplicacoes, formato: "moeda" },
    { rotulo: "Resgates", valor: tes.resgates, formato: "moeda" },
    { rotulo: "Caixa", valor: caixaDoMes, formato: "moeda" },
    { rotulo: "Tributação sobre lucro", valor: null, formato: "moeda", pendente: true },
    { rotulo: "Superávit antes da tributação", valor: null, formato: "moeda", pendente: true },
  ]
}

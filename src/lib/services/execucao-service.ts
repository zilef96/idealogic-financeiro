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

// Caixa: 1º mês = caixa inicial (saldo do exercício). Demais meses acumulam o
// superávit do mês. Aplicações/resgates NÃO entram aqui (são informativos).
// (Regra definida em 17/06/2026; refinar fórmula dos demais meses depois.)
export function projecaoCaixa(d: {
  saldoInicial: number
  superavitPorMes: number[]   // 12
}): number[] {
  const saldo: number[] = []
  for (let m = 0; m < 12; m++) {
    if (m === 0) saldo.push(d.saldoInicial)
    else saldo.push(saldo[m - 1] + (d.superavitPorMes[m] ?? 0))
  }
  return saldo
}

export interface TotaisMes {
  faturamento: number        // bloco 10000 (inclui Cotas 10100 e Tributos 10200 no nosso seed)
  cotas: number              // grupo 10100 "Cotas sócios"
  tributosFat: number        // grupo 10200 "Tributos sobre Faturamento" (inclui CSLL/IRPJ)
  tributacaoLucro: number    // item 10204 "CSLL e IRPJ"
  custos: number             // bloco 20000
  despesas: number           // bloco 30000
  dividendos: number         // bloco 40000
  custosOperacionais: number // grupo 33000
  despAdmFinComl: number     // 31000+32000+33000+34000
}

// Faturamento de serviços = 10000 sem Cotas (10100) e Tributos (10200), que no
// nosso seed são filhos de 10000. Espelha a planilha (RN-EX-04):
// FatServiços + Cotas − Tributos − Custos − Despesas − Distribuição.
export function faturamentoServicos(t: TotaisMes): number {
  return t.faturamento - t.cotas - t.tributosFat
}
export function superavitMensal(t: TotaisMes): number {
  return faturamentoServicos(t) + t.cotas - t.tributosFat - t.custos - t.despesas - t.dividendos
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
  const margem = margemContribuicao(superavit, faturamentoServicos(t))
  // custo hora = (Custos operacionais 33000 + Despesas Adm/Financ/Coml) / horas.
  // A planilha soma o 33000 também dentro de DespAdm, então ele entra duas vezes.
  const custoH = custoHora(t.custosOperacionais, t.despAdmFinComl, p.horasFaturaveis)
  const pend = !temRealizado
  const m = (valor: number | null): number | null => (temRealizado ? valor : null)
  return [
    { rotulo: "Superávit/Déficit do mês", valor: m(superavit), formato: "moeda", pendente: pend },
    { rotulo: "Tributação sobre lucro", valor: m(t.tributacaoLucro), formato: "moeda", pendente: pend },
    { rotulo: "Superávit/Déficit antes da tributação", valor: m(superavit + t.tributacaoLucro), formato: "moeda", pendente: pend },
    { rotulo: "Margem de contribuição", valor: m(margem), formato: "percent", pendente: pend },
    { rotulo: "Caixa", valor: caixaDoMes, formato: "moeda" },
    { rotulo: "Aplicações", valor: tes.aplicacoes, formato: "moeda" },
    { rotulo: "Resgate aplicação", valor: tes.resgates, formato: "moeda" },
    { rotulo: "Custos operacionais (33000)", valor: m(t.custosOperacionais), formato: "moeda", pendente: pend },
    { rotulo: "Despesas Adm, Financ e Coml", valor: m(t.despAdmFinComl), formato: "moeda", pendente: pend },
    { rotulo: "Horas faturáveis", valor: p.horasFaturaveis, formato: "numero" },
    { rotulo: "Custo hora Idealogic", valor: m(custoH), formato: "moeda", pendente: pend },
    { rotulo: "Reajuste salarial", valor: p.fatorReajuste, formato: "fator" },
  ]
}

export function formatarIndicador(i: Indicador): string {
  if (i.pendente || i.valor == null) return "—"
  switch (i.formato) {
    case "percent": return `${i.valor.toFixed(1)}%`
    case "numero": return i.valor.toLocaleString("pt-BR")
    case "fator": return i.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    default: return i.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }
}

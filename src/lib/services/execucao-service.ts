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

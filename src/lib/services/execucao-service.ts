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

// Precificação: regra pura de formação de preço (sem acesso a banco).
//
// Custo da hora = salário da tabela de progressão (PJ) ÷ horas da pessoa no mês
//               + OPEX por hora (despesas de estrutura ÷ horas faturáveis da empresa).
// Preço = custo da hora ÷ (1 − impostos sobre faturamento − comissões − margem).
// A margem é sobre o preço e é ANTES de IRPJ/CSLL (Lucro Real); o lucro líquido
// desconta IRPJ/CSLL sobre o lucro positivo.

export type Premissas = {
  horasPessoaMes: number       // horas que uma pessoa trabalha no mês (ex.: 160)
  opexHora: number             // R$ por hora vendida
  impostosFaturamento: number  // fração (0,1175 = 11,75%)
  comissoes: number            // fração sobre o preço
  margemAlvo: number           // fração sobre o preço, antes de IRPJ/CSLL
  irCsll: number               // fração sobre o lucro (0,34)
}

export const PREMISSAS_PADRAO: Omit<Premissas, "opexHora"> = {
  horasPessoaMes: 160,
  impostosFaturamento: 0.1175,
  comissoes: 0,
  margemAlvo: 0.15,
  irCsll: 0.34,
}

// Fração do preço que sobra para pagar custo + margem. ≤ 0 = premissas impossíveis.
export function sobraDoPreco(p: Premissas, margem: number): number {
  return 1 - p.impostosFaturamento - p.comissoes - margem
}

export function custoHora(salarioMensal: number, p: Premissas): { pessoa: number; opex: number; total: number } {
  const pessoa = p.horasPessoaMes > 0 ? salarioMensal / p.horasPessoaMes : 0
  return { pessoa, opex: p.opexHora, total: pessoa + p.opexHora }
}

// Preço para cobrir `custo` com a margem pedida; null se as premissas somam ≥ 100%.
export function precoPara(custo: number, p: Premissas, margem: number): number | null {
  const sobra = sobraDoPreco(p, margem)
  return sobra > 0 ? custo / sobra : null
}

// Quantas horas cabem num preço mantendo a margem pedida (margem 0 = empate).
export function tetoHoras(preco: number, custoHoraTotal: number, p: Premissas, margem: number): number | null {
  if (custoHoraTotal <= 0) return null
  return Math.max(0, (preco * sobraDoPreco(p, margem)) / custoHoraTotal)
}

export type Resultado = {
  preco: number
  impostos: number
  comissoes: number
  custoPessoa: number
  custoOpex: number
  lucroAntesIr: number
  irCsll: number
  lucroLiquido: number
  margemAntesIr: number | null  // fração do preço
  margemLiquida: number | null
}

// Demonstrativo de um preço contra um custo (por hora ou total de um contrato).
export function resultado(preco: number, custoPessoa: number, custoOpex: number, p: Premissas): Resultado {
  const impostos = preco * p.impostosFaturamento
  const comissoes = preco * p.comissoes
  const lucroAntesIr = preco - impostos - comissoes - custoPessoa - custoOpex
  const irCsll = Math.max(0, lucroAntesIr) * p.irCsll
  const lucroLiquido = lucroAntesIr - irCsll
  return {
    preco, impostos, comissoes, custoPessoa, custoOpex, lucroAntesIr, irCsll, lucroLiquido,
    margemAntesIr: preco > 0 ? lucroAntesIr / preco : null,
    margemLiquida: preco > 0 ? lucroLiquido / preco : null,
  }
}

// OPEX mensal de referência: média dos últimos `meses` meses que têm realizado.
// Recebe o total de despesas (bloco 30000) por mês; null = mês sem lançamento.
export function opexMedio(despesasPorMes: { mes: number; valor: number | null }[], meses: number): { media: number; mesesUsados: number[] } | null {
  const comDado = despesasPorMes.filter((d) => d.valor != null).sort((a, b) => a.mes - b.mes).slice(-meses)
  if (comDado.length === 0) return null
  const media = comDado.reduce((s, d) => s + (d.valor ?? 0), 0) / comDado.length
  return { media, mesesUsados: comDado.map((d) => d.mes) }
}

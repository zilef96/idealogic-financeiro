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

// O que é OPEX na precificação (mapeamento validado com o financeiro, out/2026).
// O plano de contas mistura quem executa com quem é apoio, então a regra é por conta:
// parte do bloco Despesas inteiro, tira o que não é estrutura e soma a remuneração
// dos sócios que são apoio (pró-labore + distribuição de lucros, que na prática é salário).
// Quem executa (CLT, PJ, encargos e benefícios em Custos; Guilherme Rohr; Laura) já
// entra pela tabela de Progressão — contar aqui de novo duplicaria o custo.
// Itens são achados por grupo pai + nome (itens não têm código).
export type ContaOpex = { grupo: string; nome?: string; rotulo: string }

export const REGRA_OPEX: { base: ContaOpex; tirar: ContaOpex[]; somar: ContaOpex[] } = {
  base: { grupo: "30000", rotulo: "Despesas (todo o bloco)" },
  tirar: [
    { grupo: "34100", rotulo: "Financiamentos — parcela de dívida não entra no preço" },
    { grupo: "31200", nome: "Laura Pillon", rotulo: "Laura Pillon — executa, já está na tabela" },
  ],
  somar: [
    { grupo: "20200", nome: "Feliciano de Vargas", rotulo: "Pró-labore Feliciano" },
    { grupo: "20200", nome: "Larissa Bittencourt", rotulo: "Pró-labore Larissa" },
    { grupo: "41000", nome: "Feliciano de Vargas", rotulo: "Distribuição de lucros Feliciano" },
    { grupo: "41000", nome: "Larissa Bittencourt", rotulo: "Distribuição de lucros Larissa" },
  ],
}

export type LinhaRealizado = { codigo: string; codigoPai: string; nome: string; isGrupo: boolean; mes: number; realizado: number | null }

function valorConta(linhas: LinhaRealizado[], c: ContaOpex, mes: number): number | null {
  const l = c.nome == null
    ? linhas.find((x) => x.isGrupo && x.codigo === c.grupo && x.mes === mes)
    : linhas.find((x) => !x.isGrupo && x.codigoPai === c.grupo && x.nome === c.nome && x.mes === mes)
  return l?.realizado ?? null
}

// OPEX realizado de cada mês pela REGRA_OPEX; null quando o bloco Despesas não tem lançamento.
export function opexPorMes(linhas: LinhaRealizado[], regra = REGRA_OPEX): { mes: number; valor: number | null }[] {
  return Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
    const base = valorConta(linhas, regra.base, mes)
    if (base == null) return { mes, valor: null }
    const tirar = regra.tirar.reduce((s, c) => s + (valorConta(linhas, c, mes) ?? 0), 0)
    const somar = regra.somar.reduce((s, c) => s + (valorConta(linhas, c, mes) ?? 0), 0)
    return { mes, valor: base - tirar + somar }
  })
}

// OPEX mensal de referência: média dos últimos `meses` meses que têm realizado.
export function opexMedio(despesasPorMes: { mes: number; valor: number | null }[], meses: number): { media: number; mesesUsados: number[] } | null {
  const comDado = despesasPorMes.filter((d) => d.valor != null).sort((a, b) => a.mes - b.mes).slice(-meses)
  if (comDado.length === 0) return null
  const media = comDado.reduce((s, d) => s + (d.valor ?? 0), 0) / comDado.length
  return { media, mesesUsados: comDado.map((d) => d.mes) }
}

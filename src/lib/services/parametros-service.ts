export type ChaveParametro =
  | "saldo_inicial_caixa" | "caixa_minimo" | "horas_faturaveis"
  | "aliquota_pis" | "aliquota_cofins" | "aliquota_issqn" | "fator_reajuste"

export type FormatoParametro = "moeda" | "numero" | "percent" | "fator"

export interface DefParametro {
  chave: ChaveParametro
  rotulo: string
  formato: FormatoParametro
  padrao: number
}

// Variáveis editáveis por exercício (gravadas na competência de janeiro).
export const PARAMETROS_EXERCICIO: DefParametro[] = [
  { chave: "saldo_inicial_caixa", rotulo: "Saldo inicial de caixa (31/12 anterior)", formato: "moeda", padrao: 126697.96 },
  { chave: "caixa_minimo", rotulo: "Caixa mínimo", formato: "moeda", padrao: 0 },
  { chave: "horas_faturaveis", rotulo: "Horas faturáveis", formato: "numero", padrao: 3200 },
  { chave: "aliquota_pis", rotulo: "Alíquota PIS", formato: "percent", padrao: 0.0165 },
  { chave: "aliquota_cofins", rotulo: "Alíquota COFINS", formato: "percent", padrao: 0.076 },
  { chave: "aliquota_issqn", rotulo: "Alíquota ISSQN", formato: "percent", padrao: 0.025 },
  { chave: "fator_reajuste", rotulo: "Fator de reajuste salarial", formato: "fator", padrao: 1 },
]

// Valor "do exercício": a série é ordenada por mês; pega o de menor mês (jan) ou o padrão.
export function valorExercicio(serie: { mes: number; valor: number }[], padrao: number): number {
  if (serie.length === 0) return padrao
  return serie.reduce((acc, s) => (s.mes < acc.mes ? s : acc), serie[0]).valor
}

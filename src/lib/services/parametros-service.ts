export type ChaveParametro =
  | "saldo_inicial_caixa" | "caixa_minimo" | "horas_faturaveis" | "fator_reajuste"

export type FormatoParametro = "moeda" | "numero" | "percent" | "fator"

export interface DefParametro {
  chave: ChaveParametro
  rotulo: string
  formato: FormatoParametro
  padrao: number
}

// Parâmetros manuais e mensais (competência + vigência). Não há mais "valor do exercício".
export const PARAMETROS_MENSAIS: DefParametro[] = [
  { chave: "saldo_inicial_caixa", rotulo: "Saldo inicial de caixa (31/12 anterior)", formato: "moeda", padrao: 126697.96 },
  { chave: "caixa_minimo", rotulo: "Caixa mínimo", formato: "moeda", padrao: 0 },
  { chave: "horas_faturaveis", rotulo: "Horas faturáveis", formato: "numero", padrao: 3200 },
  { chave: "fator_reajuste", rotulo: "Fator de reajuste salarial", formato: "fator", padrao: 1 },
]

// Chaves que o modal da Execução edita. caixa_minimo permanece no domínio/seed
// (o Dashboard lê o valor gravado), mas sem editor.
export const CHAVES_EDITAVEIS_MODAL = ["saldo_inicial_caixa", "horas_faturaveis", "fator_reajuste"] as const

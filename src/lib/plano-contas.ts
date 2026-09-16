export const CODIGO_TRIBUTOS_FATURAMENTO = "10200"

// Fonte única dos itens oficiais do bloco. Itens não possuem mais código no
// modelo atual, portanto a integração semântica é feita por grupo + nome.
export const ITENS_TRIBUTOS_FATURAMENTO = {
  pis: "PIS",
  cofins: "COFINS",
  issqn: "ISSQN",
  tributacaoLucro: "CSLL e IRPJ",
  retencaoNf: "Retenção NF",
} as const

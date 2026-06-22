export type Periodicidade = "M" | "A"
export type Classificacao = "C" | "P" | "E" | "S"
export type TipoConta = "R" | "C" | "D" | "E"

export interface LinhaOrcamento {
  id: number
  grupoId: number
  grupoCodigo: string
  codigo: string
  nome: string
  periodicidade: Periodicidade
  classificacao: Classificacao | null
  mesInicio: number | null
  mesFim: number | null
  valorOrcado: number        // valor informado (RN-OR-06; não-somável)
  valorOrcadoMensal: number  // por mês (base de todo rollup)
  orcadoPorMes: number[]     // 12 posições
  comentarios: string | null
}

export interface GrupoOrcamento {
  id: number
  codigo: string
  codigoPai: string | null
  tipo: TipoConta
  nome: string
}

export interface NovoItemInput {
  grupoId: number
  nome: string
  periodicidade: Periodicidade
  valor: number
  classificacao?: Classificacao | null
  mesInicio?: number | null
  mesFim?: number | null
}

export interface AtualizarItemInput {
  nome?: string
  periodicidade?: Periodicidade
  valor?: number
  classificacao?: Classificacao | null
  mesInicio?: number | null
  mesFim?: number | null
}

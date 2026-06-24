// Service puro da criação de período: ordenação topológica da cópia e a base do "do zero".

export type GrupoCopia = {
  codigo: number
  paiCodigo: number | null
  tipoContaId: number
  nome: string
}

// Ordena os grupos para inserção: todo pai antes de qualquer filho (Kahn).
// Substitui o frágil ORDER BY codigo::numeric (não garante pai < filho).
// Órfãos (paiCodigo que não existe na lista) são descartados — não há onde pendurá-los.
export function planejarCopiaGrupos(grupos: GrupoCopia[]): GrupoCopia[] {
  const presentes = new Set(grupos.map((g) => g.codigo))
  const inseridos = new Set<number>()
  const ordenados: GrupoCopia[] = []
  // Pendentes só os que têm raiz alcançável (pai null ou pai presente na lista).
  let pendentes = grupos.filter((g) => g.paiCodigo === null || presentes.has(g.paiCodigo))

  let avancou = true
  while (pendentes.length > 0 && avancou) {
    avancou = false
    const restantes: GrupoCopia[] = []
    for (const g of pendentes) {
      const paiPronto = g.paiCodigo === null || inseridos.has(g.paiCodigo)
      if (paiPronto) {
        ordenados.push(g)
        inseridos.add(g.codigo)
        avancou = true
      } else {
        restantes.push(g)
      }
    }
    pendentes = restantes
  }
  return ordenados
}

export type BlocoBase = { codigo: number; sigla: "R" | "C" | "D" | "E"; nome: string }

// Base do "começar do zero": só os 4 blocos-raiz (espelha o seed 2026).
export const BLOCOS_BASE: readonly BlocoBase[] = [
  { codigo: 10000, sigla: "R", nome: "Faturamento total" },
  { codigo: 20000, sigla: "C", nome: "Custos totais" },
  { codigo: 30000, sigla: "D", nome: "Despesas totais" },
  { codigo: 40000, sigla: "E", nome: "Dividendos" },
]

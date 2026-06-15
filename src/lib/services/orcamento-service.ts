import type { Periodicidade, Classificacao, GrupoOrcamento, LinhaOrcamento } from "@/lib/types"

export function normalizarOrcado(valor: number, periodicidade: Periodicidade) {
  if (periodicidade === "A") return { valorOrcado: valor, valorOrcadoMensal: valor / 12 }
  return { valorOrcado: valor * 12, valorOrcadoMensal: valor }
}

export function distribuirPorMes(item: {
  periodicidade: Periodicidade
  valorOrcadoMensal: number
  mesInicio: number | null
  mesFim: number | null
}): number[] {
  const meses = new Array(12).fill(0)
  // anual: sempre jan–dez; mensal: respeita vigência (default 1..12)
  const ini = item.periodicidade === "A" ? 1 : item.mesInicio ?? 1
  const fim = item.periodicidade === "A" ? 12 : item.mesFim ?? 12
  for (let m = ini; m <= fim; m++) meses[m - 1] = item.valorOrcadoMensal
  return meses
}

export function somasPorClassificacao(
  itens: { valorOrcado: number; classificacao: Classificacao | null }[],
): Record<"C" | "P" | "E" | "S", number> {
  const soma = { C: 0, P: 0, E: 0, S: 0 }
  for (const i of itens) if (i.classificacao) soma[i.classificacao] += i.valorOrcado
  return soma
}

export interface RollupTotais { total: number; mensal: number; ess: number; cond: number }

// Coluna "Essencial" agrega Contratado (receita) + Essencial (saída);
// coluna "Condicionado" agrega Projetado (receita) + Condicionado (saída).
export function ehEssencial(c: Classificacao | null): boolean {
  return c === "C" || c === "E"
}

// Total do grupo com rollup recursivo: itens diretos + todos os descendentes.
export function rollupGrupo(
  grupoCodigo: string,
  grupos: GrupoOrcamento[],
  linhas: LinhaOrcamento[],
): RollupTotais {
  const r: RollupTotais = { total: 0, mensal: 0, ess: 0, cond: 0 }
  for (const l of linhas) {
    if (l.grupoCodigo !== grupoCodigo) continue
    r.total += l.valorOrcado
    r.mensal += l.valorOrcadoMensal
    if (ehEssencial(l.classificacao)) r.ess += l.valorOrcado
    else r.cond += l.valorOrcado
  }
  for (const filho of grupos) {
    if (filho.codigoPai !== grupoCodigo) continue
    const s = rollupGrupo(filho.codigo, grupos, linhas)
    r.total += s.total; r.mensal += s.mensal; r.ess += s.ess; r.cond += s.cond
  }
  return r
}

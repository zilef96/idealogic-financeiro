import type { Periodicidade, Classificacao, GrupoOrcamento, LinhaOrcamento } from "@/lib/types"

export function normalizarOrcado(valor: number, periodicidade: Periodicidade) {
  if (periodicidade === "A") return { valorOrcado: valor, valorOrcadoMensal: valor / 12 }
  return { valorOrcado: valor, valorOrcadoMensal: valor }
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
  itens: { valorOrcadoMensal: number; classificacao: Classificacao | null }[],
): Record<"C" | "P" | "E" | "S", number> {
  const soma = { C: 0, P: 0, E: 0, S: 0 }
  for (const i of itens) if (i.classificacao) soma[i.classificacao] += i.valorOrcadoMensal
  return soma
}

export interface RollupTotais { total: number; mensal: number; ess: number; cond: number; essMensal: number; condMensal: number }

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
  const r: RollupTotais = { total: 0, mensal: 0, ess: 0, cond: 0, essMensal: 0, condMensal: 0 }
  for (const l of linhas) {
    if (l.grupoCodigo !== grupoCodigo) continue
    r.total += l.valorOrcado
    r.mensal += l.valorOrcadoMensal
    if (ehEssencial(l.classificacao)) { r.ess += l.valorOrcado; r.essMensal += l.valorOrcadoMensal }
    else { r.cond += l.valorOrcado; r.condMensal += l.valorOrcadoMensal }
  }
  for (const filho of grupos) {
    if (filho.codigoPai !== grupoCodigo) continue
    const s = rollupGrupo(filho.codigo, grupos, linhas)
    r.total += s.total; r.mensal += s.mensal; r.ess += s.ess; r.cond += s.cond
    r.essMensal += s.essMensal; r.condMensal += s.condMensal
  }
  return r
}

// Orçamento publicado fica congelado; só rascunho aceita escrita.
export function podeEditarOrcamento(status: string): boolean {
  return status !== "publicado"
}

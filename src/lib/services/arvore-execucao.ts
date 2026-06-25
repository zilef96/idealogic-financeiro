import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"

// Nó da árvore de Execução. Chave estável e única: grupo por código,
// item por id (item não tem mais código próprio).
export interface NoExecucao {
  chave: string
  codigo: string          // código do grupo; '' para item
  codigoPai: string
  nome: string
  isGrupo: boolean
  itemId: number | null
  porMes: Map<number, LinhaExecucao>
}

function chaveDe(l: { isGrupo: boolean; codigo: string; itemId: number | null }): string {
  return l.isGrupo ? `g:${l.codigo}` : `i:${l.itemId}`
}

// Grupos antes de itens; grupos por código numérico; itens por id (ordem de criação).
function ordenar(ns: NoExecucao[]): NoExecucao[] {
  return ns.sort((a, b) =>
    a.isGrupo !== b.isGrupo ? (a.isGrupo ? -1 : 1)
    : a.isGrupo ? Number(a.codigo) - Number(b.codigo)
    : (a.itemId ?? 0) - (b.itemId ?? 0))
}

export function indexarExecucao(linhas: LinhaExecucao[]): {
  todos: NoExecucao[]
  raizes: NoExecucao[]
  filhosDe: (codigoPai: string) => NoExecucao[]
} {
  const por = new Map<string, NoExecucao>()
  for (const l of linhas) {
    const k = chaveDe(l)
    let e = por.get(k)
    if (!e) {
      e = { chave: k, codigo: l.codigo, codigoPai: l.codigoPai, nome: l.nome,
            isGrupo: l.isGrupo, itemId: l.itemId, porMes: new Map() }
      por.set(k, e)
    }
    e.porMes.set(l.mes, l)
  }
  const todos = [...por.values()]
  return {
    todos,
    raizes: ordenar(todos.filter((e) => e.codigoPai === "")),
    filhosDe: (cod) => ordenar(todos.filter((e) => e.codigoPai === cod)),
  }
}

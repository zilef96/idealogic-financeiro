import { describe, it, expect } from "vitest"
import { indexarExecucao } from "@/lib/services/arvore-execucao"
import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"

function item(itemId: number, grupoCodigo: string, mes: number): LinhaExecucao {
  return { itemId, codigoPai: grupoCodigo, codigo: "", nome: `i${itemId}`, isGrupo: false,
    mes, orcadoProjetado: 0, orcado: 0, realizado: null, desvio: 0, desvioPercentual: null }
}
function grupo(codigo: string, codigoPai: string, mes: number): LinhaExecucao {
  return { itemId: null, codigoPai, codigo, nome: codigo, isGrupo: true,
    mes, orcadoProjetado: 0, orcado: 0, realizado: null, desvio: 0, desvioPercentual: null }
}

describe("indexarExecucao", () => {
  it("não funde itens sem código distintos (id é a chave)", () => {
    const linhas = [grupo("10020", "", 1), item(5, "10020", 1), item(6, "10020", 1)]
    const filhos = indexarExecucao(linhas).filhosDe("10020")
    expect(filhos).toHaveLength(2)
    expect(filhos.map((f) => f.itemId)).toEqual([5, 6])
  })

  it("mistura subgrupo e item sob o mesmo pai (grupo antes de item)", () => {
    const linhas = [grupo("10020", "", 1), grupo("10025", "10020", 1), item(7, "10020", 1)]
    const filhos = indexarExecucao(linhas).filhosDe("10020")
    expect(filhos.map((f) => f.chave)).toEqual(["g:10025", "i:7"])
  })

  it("agrega os meses de cada nó em porMes", () => {
    const linhas = [item(5, "10020", 1), item(5, "10020", 2)]
    const todos = indexarExecucao(linhas).todos
    expect(todos).toHaveLength(1)
    expect([...todos[0].porMes.keys()].sort()).toEqual([1, 2])
  })

  it("raizes = nós com codigoPai vazio, ordenados por código", () => {
    const linhas = [grupo("20000", "", 1), grupo("10000", "", 1)]
    expect(indexarExecucao(linhas).raizes.map((r) => r.codigo)).toEqual(["10000", "20000"])
  })
})

import { describe, it, expect } from "vitest"
import { blocosRaiz, filhosDe, ehFolha, classificacoesDoTipo } from "@/lib/services/cascata-grupos"
import type { GrupoOrcamento } from "@/lib/types"

// Árvore-fixture: bloco D(4) → grupo 41 → subgrupos 411 (folha) e 412 (folha); bloco R(1) raiz
// solta; bloco R(2) segunda raiz também tipo R (caso "Faturamento" + "Tributos sobre Faturamento").
const grupos: GrupoOrcamento[] = [
  { id: 1, codigo: "1", codigoPai: null, tipo: "R", nome: "Receitas" },
  { id: 2, codigo: "2", codigoPai: null, tipo: "R", nome: "Tributos sobre Faturamento" },
  { id: 4, codigo: "4", codigoPai: null, tipo: "D", nome: "Despesas" },
  { id: 41, codigo: "41", codigoPai: "4", tipo: "D", nome: "Pessoal" },
  { id: 412, codigo: "412", codigoPai: "41", tipo: "D", nome: "Encargos" },
  { id: 411, codigo: "411", codigoPai: "41", tipo: "D", nome: "Salários" },
]

describe("blocosRaiz", () => {
  it("retorna os nós raiz (codigoPai null), ordenados por código", () => {
    expect(blocosRaiz(grupos).map((g) => g.codigo)).toEqual(["1", "2", "4"])
  })
  it("mantém dois blocos-raiz distintos mesmo com o mesmo tipo", () => {
    const raizesR = blocosRaiz(grupos).filter((g) => g.tipo === "R")
    expect(raizesR.map((g) => g.nome)).toEqual(["Receitas", "Tributos sobre Faturamento"])
  })
})

describe("filhosDe", () => {
  it("filhos diretos ordenados por código numérico", () => {
    expect(filhosDe(grupos, "41").map((g) => g.codigo)).toEqual(["411", "412"])
  })
  it("nó folha não tem filhos", () => {
    expect(filhosDe(grupos, "411")).toEqual([])
  })
})

describe("ehFolha", () => {
  it("true quando ninguém aponta para o grupo", () => {
    expect(ehFolha(grupos, grupos.find((g) => g.codigo === "411")!)).toBe(true)
  })
  it("false quando tem subgrupos", () => {
    expect(ehFolha(grupos, grupos.find((g) => g.codigo === "41")!)).toBe(false)
  })
})

describe("classificacoesDoTipo", () => {
  it("R oferece Contratado e Projetado", () => {
    expect(classificacoesDoTipo("R").map((c) => c.v)).toEqual(["C", "P"])
  })
  it("C/D/E oferecem Essencial e Condicionado", () => {
    expect(classificacoesDoTipo("D").map((c) => c.v)).toEqual(["E", "S"])
  })
})

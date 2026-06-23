import { describe, it, expect } from "vitest"
import { blocosDisponiveis, raizDoBloco, filhosDe, ehFolha, classificacoesDoTipo } from "@/lib/services/cascata-grupos"
import type { GrupoOrcamento } from "@/lib/types"

// Árvore-fixture: bloco D(4) → grupo 41 → subgrupos 411 (folha) e 412 (folha); bloco R(1) raiz solta.
const grupos: GrupoOrcamento[] = [
  { id: 1, codigo: "1", codigoPai: null, tipo: "R", nome: "Receitas" },
  { id: 4, codigo: "4", codigoPai: null, tipo: "D", nome: "Despesas" },
  { id: 41, codigo: "41", codigoPai: "4", tipo: "D", nome: "Pessoal" },
  { id: 412, codigo: "412", codigoPai: "41", tipo: "D", nome: "Encargos" },
  { id: 411, codigo: "411", codigoPai: "41", tipo: "D", nome: "Salários" },
]

describe("blocosDisponiveis", () => {
  it("retorna tipos distintos na ordem R,C,D,E", () => {
    expect(blocosDisponiveis(grupos)).toEqual(["R", "D"])
  })
})

describe("raizDoBloco", () => {
  it("acha o nó raiz (codigoPai null) do tipo", () => {
    expect(raizDoBloco(grupos, "D")?.codigo).toBe("4")
  })
  it("retorna undefined quando o tipo não tem raiz", () => {
    expect(raizDoBloco(grupos, "C")).toBeUndefined()
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

import { describe, it, expect } from "vitest"
import { construirTotais, competenciaRef, type LinhaDash } from "@/lib/services/dashboard-service"

// Helper: cria linhas para um único mês. `vals` mapeia codigo→{orcado,realizado}.
function linhas(mes: number, vals: Record<string, { o: number; r: number | null; grupo?: boolean; pai?: string }>): LinhaDash[] {
  return Object.entries(vals).map(([codigo, v]) => ({
    codigo, codigoPai: v.pai ?? "", nome: codigo, isGrupo: v.grupo ?? true, mes,
    orcado: v.o, realizado: v.r,
  }))
}

describe("construirTotais", () => {
  const ls = linhas(1, {
    "10000": { o: 100, r: 90 }, "10100": { o: 10, r: 8 }, "10200": { o: 5, r: 4 },
    "20000": { o: 30, r: 25 }, "30000": { o: 20, r: 18 }, "40000": { o: 10, r: 9 },
    "31000": { o: 5, r: 4 }, "32000": { o: 3, r: 2 }, "33000": { o: 4, r: 3 }, "34000": { o: 2, r: 1 },
    "10204": { o: 1, r: 1, grupo: false },
  })
  it("monta TotaisMes do realizado", () => {
    const t = construirTotais(ls, "realizado", 1)
    expect(t.faturamento).toBe(90)
    expect(t.cotas).toBe(8)
    expect(t.tributosFat).toBe(4)
    expect(t.custosOperacionais).toBe(3)
    expect(t.despAdmFinComl).toBe(4 + 2 + 3 + 1)
    expect(t.tributacaoLucro).toBe(1)
  })
  it("usa 0 para realizado nulo", () => {
    const semR = linhas(2, { "10000": { o: 100, r: null } })
    expect(construirTotais(semR, "realizado", 2).faturamento).toBe(0)
  })
})

describe("competenciaRef", () => {
  it("retorna o maior mês com algum realizado não-nulo", () => {
    const ls = [
      ...linhas(1, { "10000": { o: 1, r: 1 } }),
      ...linhas(2, { "10000": { o: 1, r: 1 } }),
      ...linhas(3, { "10000": { o: 1, r: null } }),
    ]
    expect(competenciaRef(ls)).toBe(2)
  })
  it("retorna 0 quando não há realizado", () => {
    expect(competenciaRef(linhas(1, { "10000": { o: 1, r: null } }))).toBe(0)
  })
})

import { describe, it, expect } from "vitest"
import { normalizarOrcado, distribuirPorMes, somasPorClassificacao, rollupGrupo, podeEditarOrcamento, vigenciaInvalidaPorFechamento } from "@/lib/services/orcamento-service"
import type { GrupoOrcamento, LinhaOrcamento } from "@/lib/types"

describe("normalizarOrcado", () => {
  it("mensal: valorOrcado = valor informado (não × 12)", () => {
    expect(normalizarOrcado(100, "M")).toEqual({ valorOrcado: 100, valorOrcadoMensal: 100 })
  })
  it("anual: valorOrcado = valor informado, mensal = valor/12", () => {
    expect(normalizarOrcado(1200, "A")).toEqual({ valorOrcado: 1200, valorOrcadoMensal: 100 })
  })
})

describe("distribuirPorMes", () => {
  it("mensal sem vigência: 12 meses iguais", () => {
    const r = distribuirPorMes({ periodicidade: "M", valorOrcadoMensal: 100, mesInicio: null, mesFim: null })
    expect(r).toHaveLength(12)
    expect(r.every((v) => v === 100)).toBe(true)
  })
  it("mensal com vigência mar–mai: zero fora, valor dentro", () => {
    const r = distribuirPorMes({ periodicidade: "M", valorOrcadoMensal: 50, mesInicio: 3, mesFim: 5 })
    expect(r).toEqual([0,0,50,50,50,0,0,0,0,0,0,0])
  })
  it("anual: divide ÷12 em todos os meses", () => {
    const r = distribuirPorMes({ periodicidade: "A", valorOrcadoMensal: 100, mesInicio: null, mesFim: null })
    expect(r.reduce((a,b)=>a+b,0)).toBeCloseTo(1200)
    expect(r.every((v) => v === 100)).toBe(true)
  })
})

describe("somasPorClassificacao", () => {
  const itens = [
    { valorOrcadoMensal: 100, classificacao: "C" as const },
    { valorOrcadoMensal: 50,  classificacao: "P" as const },
    { valorOrcadoMensal: 30,  classificacao: "C" as const },
  ]
  it("soma valorOrcadoMensal por classificação", () => {
    expect(somasPorClassificacao(itens)).toEqual({ C: 130, P: 50, E: 0, S: 0 })
  })
})

describe("rollupGrupo", () => {
  // raiz 100 -> filho 110 (com 2 itens) + 1 item direto na raiz
  const grupos: GrupoOrcamento[] = [
    { id: 1, codigo: "100", codigoPai: null,  tipo: "R", nome: "Raiz" },
    { id: 2, codigo: "110", codigoPai: "100", tipo: "R", nome: "Filho" },
  ]
  const linha = (grupoCodigo: string, valorOrcado: number, valorOrcadoMensal: number, classificacao: LinhaOrcamento["classificacao"]): LinhaOrcamento => ({
    id: Math.random(), grupoId: 0, grupoCodigo, nome: "i", periodicidade: "M",
    classificacao, mesInicio: null, mesFim: null, valorOrcado, valorOrcadoMensal, orcadoPorMes: [], comentarios: null,
  })
  const linhas: LinhaOrcamento[] = [
    linha("110", 1000, 100, "C"), // essencial (C)
    linha("110", 500, 50, "P"),   // condicionado (P)
    linha("100", 200, 20, "C"),   // item direto na raiz, essencial
  ]
  it("soma recursivamente todos os descendentes (mensal)", () => {
    expect(rollupGrupo("100", grupos, linhas)).toEqual({ mensal: 170, essMensal: 120, condMensal: 50 })
  })
  it("grupo folha soma só seus itens diretos (mensal)", () => {
    expect(rollupGrupo("110", grupos, linhas)).toEqual({ mensal: 150, essMensal: 100, condMensal: 50 })
  })
  it("orçado mensal = essencial mensal + condicionado mensal", () => {
    const r = rollupGrupo("100", grupos, linhas)
    expect(r.essMensal + r.condMensal).toBe(r.mensal)
  })
})

describe("podeEditarOrcamento", () => {
  it("rascunho é editável", () => {
    expect(podeEditarOrcamento("rascunho")).toBe(true)
  })
  it("publicado não é editável", () => {
    expect(podeEditarOrcamento("publicado")).toBe(false)
  })
})

describe("vigenciaInvalidaPorFechamento", () => {
  const status = (fechados: number[]) =>
    Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, fechados.includes(i + 1) ? "concluido" : "aberto"])) as Record<number, "aberto" | "concluido">

  it("M intervalo todo aberto → false", () => {
    expect(vigenciaInvalidaPorFechamento("M", 6, 12, status([]))).toBe(false)
  })
  it("M mês fechado no extremo inicial → true", () => {
    expect(vigenciaInvalidaPorFechamento("M", 5, 7, status([5]))).toBe(true)
  })
  it("M mês fechado no meio → true", () => {
    expect(vigenciaInvalidaPorFechamento("M", 4, 7, status([5]))).toBe(true)
  })
  it("A com qualquer mês fechado (usa 1..12) → true", () => {
    expect(vigenciaInvalidaPorFechamento("A", null, null, status([3]))).toBe(true)
  })
  it("M sem vigência (nulls) trata como 1..12", () => {
    expect(vigenciaInvalidaPorFechamento("M", null, null, status([1]))).toBe(true)
  })
})

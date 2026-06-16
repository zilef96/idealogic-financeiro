import { describe, it, expect } from "vitest"
import { calcDesvio, margemContribuicao, custoHora, tributosSobreFaturamento } from "@/lib/services/execucao-service"

describe("calcDesvio", () => {
  it("desvio e percentual", () => {
    expect(calcDesvio(120, 100)).toEqual({ desvio: 20, desvioPercentual: 20 })
  })
  it("orçado zero → percentual nulo", () => {
    expect(calcDesvio(50, 0)).toEqual({ desvio: 50, desvioPercentual: null })
  })
})

describe("margemContribuicao", () => {
  it("superávit/faturamento em %", () => {
    expect(margemContribuicao(30, 100)).toBe(30)
  })
  it("faturamento zero → null", () => {
    expect(margemContribuicao(10, 0)).toBeNull()
  })
})

describe("custoHora", () => {
  it("(custos op + despesas adm) / horas", () => {
    expect(custoHora(20000, 6000, 3200)).toBeCloseTo(8.125)
  })
  it("horas zero → null", () => {
    expect(custoHora(1, 1, 0)).toBeNull()
  })
})

describe("tributosSobreFaturamento", () => {
  it("soma pis+cofins+issqn sobre receita realizada", () => {
    expect(tributosSobreFaturamento(10000, { pis: 0.0165, cofins: 0.076, issqn: 0.025 }))
      .toBeCloseTo(1175)
  })
})

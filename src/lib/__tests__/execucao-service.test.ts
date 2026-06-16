import { describe, it, expect } from "vitest"
import { calcDesvio, margemContribuicao, custoHora, tributosSobreFaturamento, projecaoCaixa, valorVigente } from "@/lib/services/execucao-service"

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

describe("projecaoCaixa", () => {
  it("acumula saldo inicial + superávit ± tesouraria", () => {
    const r = projecaoCaixa({
      saldoInicial: 1000,
      superavitPorMes: [100, 200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      aplicacoesPorMes: [0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],   // saída de caixa
      resgatesPorMes:   [0, 0, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0],   // entrada de caixa
    })
    expect(r[0]).toBe(1100)            // 1000 + 100
    expect(r[1]).toBe(1250)            // 1100 + 200 - 50 (aplicação)
    expect(r[2]).toBe(1280)            // 1250 + 0 + 30 (resgate)
  })
})

describe("valorVigente", () => {
  const serie = [{ mes: 1, valor: 0.0165 }, { mes: 4, valor: 0.02 }]
  it("usa o último valor com competência ≤ mês", () => {
    expect(valorVigente(serie, 3)).toBe(0.0165)
    expect(valorVigente(serie, 4)).toBe(0.02)
    expect(valorVigente(serie, 9)).toBe(0.02)
  })
  it("antes do primeiro valor → default", () => {
    expect(valorVigente([{ mes: 4, valor: 1.05 }], 2, 1)).toBe(1)
  })
  it("série vazia → default", () => {
    expect(valorVigente([], 6, 3200)).toBe(3200)
  })
})

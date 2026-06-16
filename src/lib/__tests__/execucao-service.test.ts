import { describe, it, expect } from "vitest"
import { calcDesvio, margemContribuicao, custoHora, tributosSobreFaturamento, projecaoCaixa, valorVigente, superavitMensal, calcularIndicadoresMes, type TotaisMes } from "@/lib/services/execucao-service"

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

const baseTotais: TotaisMes = {
  faturamento: 100000, tributosFat: 10000, custos: 30000, despesas: 20000,
  dividendos: 5000, custosOperacionais: 8000, despAdmFinComl: 16000,
}

describe("superavitMensal", () => {
  it("(faturamento - tributos) - custos - despesas - dividendos", () => {
    expect(superavitMensal(baseTotais)).toBe(35000)
  })
})

const baseInput = {
  totais: baseTotais,
  parametros: { pis: 0.0165, cofins: 0.076, issqn: 0.025, horasFaturaveis: 3200, fatorReajuste: 1.05 },
  tesouraria: { aplicacoes: 0, resgates: 43618.55 },
  caixaDoMes: 150000,
  temRealizado: true,
}
const val = (lista: { rotulo: string; valor: number | null }[], rotulo: string) =>
  lista.find((i) => i.rotulo === rotulo)?.valor ?? null

describe("calcularIndicadoresMes", () => {
  it("calcula os indicadores principais", () => {
    const r = calcularIndicadoresMes(baseInput)
    expect(val(r, "Superávit/Déficit")).toBe(35000)
    expect(val(r, "Margem de contribuição")).toBe(35)
    expect(val(r, "Tributos s/ faturamento")).toBeCloseTo(10575)
    expect(val(r, "Custo hora Idealogic")).toBeCloseTo(5)
    expect(val(r, "Custos operacionais")).toBe(8000)
    expect(val(r, "Horas faturáveis")).toBe(3200)
    expect(val(r, "Reajuste salarial")).toBe(1.05)
    expect(val(r, "Caixa")).toBe(150000)
    expect(val(r, "Resgates")).toBe(43618.55)
  })
  it("marca os indicadores de P-04 como pendentes", () => {
    const r = calcularIndicadoresMes(baseInput)
    const p = r.find((i) => i.rotulo === "Tributação sobre lucro")
    expect(p?.valor).toBeNull()
    expect(p?.pendente).toBe(true)
  })
  it("mês sem realizado → indicadores monetários pendentes, parâmetros mantidos", () => {
    const r = calcularIndicadoresMes({ ...baseInput, temRealizado: false })
    expect(val(r, "Superávit/Déficit")).toBeNull()
    expect(r.find((i) => i.rotulo === "Superávit/Déficit")?.pendente).toBe(true)
    expect(val(r, "Horas faturáveis")).toBe(3200)
  })
})

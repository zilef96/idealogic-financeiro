import { describe, it, expect } from "vitest"
import { normalizarOrcado, distribuirPorMes } from "@/lib/services/orcamento-service"

describe("normalizarOrcado", () => {
  it("mensal: mensal=valor, anual=valor*12", () => {
    expect(normalizarOrcado(100, "M")).toEqual({ valorOrcado: 1200, valorOrcadoMensal: 100 })
  })
  it("anual: mensal=valor/12, anual=valor", () => {
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

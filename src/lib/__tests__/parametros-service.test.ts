import { describe, it, expect } from "vitest"
import { valorExercicio, PARAMETROS_EXERCICIO } from "@/lib/services/parametros-service"

describe("valorExercicio", () => {
  it("usa o valor da menor competência (jan) quando existe", () => {
    expect(valorExercicio([{ mes: 1, valor: 126697.96 }, { mes: 6, valor: 999 }], 0)).toBe(126697.96)
  })
  it("série vazia → padrão", () => {
    expect(valorExercicio([], 3200)).toBe(3200)
  })
})

describe("PARAMETROS_EXERCICIO", () => {
  it("inclui saldo inicial, caixa mínimo, horas e as 3 alíquotas", () => {
    const chaves = PARAMETROS_EXERCICIO.map((p) => p.chave)
    expect(chaves).toContain("saldo_inicial_caixa")
    expect(chaves).toContain("caixa_minimo")
    expect(chaves).toContain("horas_faturaveis")
    expect(chaves).toContain("aliquota_pis")
    expect(chaves).toContain("aliquota_cofins")
    expect(chaves).toContain("aliquota_issqn")
  })
})

import { describe, it, expect } from "vitest"
import { PARAMETROS_MENSAIS, CHAVES_EDITAVEIS_MODAL } from "@/lib/services/parametros-service"

describe("PARAMETROS_MENSAIS", () => {
  it("mantém apenas as 4 chaves mensais, sem alíquotas", () => {
    const chaves = PARAMETROS_MENSAIS.map((p) => p.chave)
    expect(chaves).toEqual(["saldo_inicial_caixa", "caixa_minimo", "horas_faturaveis", "fator_reajuste"])
    expect(chaves).not.toContain("aliquota_pis")
    expect(chaves).not.toContain("aliquota_cofins")
    expect(chaves).not.toContain("aliquota_issqn")
  })
})

describe("CHAVES_EDITAVEIS_MODAL", () => {
  it("expõe só as chaves que o modal edita (caixa_minimo fica fora — sem editor)", () => {
    expect(CHAVES_EDITAVEIS_MODAL).toEqual(["saldo_inicial_caixa", "horas_faturaveis", "fator_reajuste"])
    expect(CHAVES_EDITAVEIS_MODAL).not.toContain("caixa_minimo")
  })
})

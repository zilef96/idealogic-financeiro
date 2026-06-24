import { describe, it, expect } from "vitest"
import { mapErroPostgres, anoSchema, mesSchema } from "@/lib/api-helpers"

describe("mapErroPostgres", () => {
  it("mapeia FC001 para 409", () => {
    const r = mapErroPostgres({ code: "FC001" })
    expect(r).toEqual({ status: 409, error: "Competência fechada; reabra o mês para editar." })
  })
  it("mapeia FC001 encapsulado pelo Prisma (P2010 + meta.code) para 409", () => {
    const r = mapErroPostgres({ code: "P2010", meta: { code: "FC001" } })
    expect(r).toEqual({ status: 409, error: "Competência fechada; reabra o mês para editar." })
  })
  it("retorna null para erro desconhecido", () => {
    expect(mapErroPostgres({ code: "XX999" })).toBeNull()
  })
})
describe("schemas", () => {
  it("anoSchema aceita 2026 e rejeita 1000", () => {
    expect(anoSchema.parse("2026")).toBe(2026)
    expect(() => anoSchema.parse("1000")).toThrow()
  })
  it("mesSchema rejeita 13", () => {
    expect(() => mesSchema.parse("13")).toThrow()
  })
})

describe("mapErroPostgres — orçamento publicado", () => {
  it("mensagem com OR_PUBLICADO vira 409", () => {
    expect(mapErroPostgres({ message: "OR_PUBLICADO" })).toEqual({
      status: 409,
      error: "Orçamento publicado; despublique o ano para editar.",
    })
  })
})

describe("mapErroPostgres — vigência em mês fechado", () => {
  it("mapeia VIGENCIA_MES_FECHADO para 409", () => {
    expect(mapErroPostgres({ message: "VIGENCIA_MES_FECHADO" })).toEqual({
      status: 409, error: "Período inclui mês concluído; ajuste a vigência.",
    })
  })
})

describe("mapErroPostgres — criar período (frente 5)", () => {
  it("mapeia PERIODO_DUPLICADO para 409", () => {
    expect(mapErroPostgres({ message: "PERIODO_DUPLICADO" })).toEqual({
      status: 409, error: "Período já existe para esse ano.",
    })
  })
  it("mapeia ORIGEM_INEXISTENTE para 422", () => {
    expect(mapErroPostgres({ message: "ORIGEM_INEXISTENTE" })).toEqual({
      status: 422, error: "Ano de origem inexistente.",
    })
  })
})

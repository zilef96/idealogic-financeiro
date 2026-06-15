import { describe, it, expect } from "vitest"
import { podeAcessar } from "@/lib/auth"

describe("podeAcessar", () => {
  it("admin acessa rota de admin", () => {
    expect(podeAcessar("admin", ["admin"])).toBe(true)
  })
  it("socio NÃO acessa rota de admin", () => {
    expect(podeAcessar("socio", ["admin"])).toBe(false)
  })
  it("socio acessa rota liberada a socio", () => {
    expect(podeAcessar("socio", ["socio", "admin"])).toBe(true)
  })
})

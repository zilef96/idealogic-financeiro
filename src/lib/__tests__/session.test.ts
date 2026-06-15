import { describe, it, expect, beforeAll } from "vitest"
import { assinarSessao, verificarSessao } from "@/lib/session"

beforeAll(() => { process.env.AUTH_SECRET = "x".repeat(32) })

describe("sessão JWT", () => {
  it("assina e verifica o mesmo payload", async () => {
    const token = await assinarSessao({ sub: "1", email: "a@b.com", perfil: "admin", nome: "A" })
    const s = await verificarSessao(token)
    expect(s?.perfil).toBe("admin")
    expect(s?.email).toBe("a@b.com")
  })
  it("rejeita token adulterado", async () => {
    const s = await verificarSessao("token.invalido.aqui")
    expect(s).toBeNull()
  })
})

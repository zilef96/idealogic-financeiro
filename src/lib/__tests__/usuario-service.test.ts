import { describe, it, expect } from "vitest"
import { combinarStatus, montarLinkConfirmacao } from "@/lib/services/usuario-service"

describe("combinarStatus", () => {
  const base = [
    { id: "1", nome: "Ana", email: "ana@x.com", perfil: "admin", auth_user_id: "uid-1" },
    { id: "2", nome: "Bia", email: "bia@x.com", perfil: "socio", auth_user_id: "uid-2" },
    { id: "3", nome: "Cid", email: "cid@x.com", perfil: "socio", auth_user_id: null },
  ]

  it("marca ativo quem já fez login e pendente o resto", () => {
    const auth = [
      { id: "uid-1", last_sign_in_at: "2026-07-01T10:00:00Z" },
      { id: "uid-2", last_sign_in_at: null },
    ]
    const r = combinarStatus(base, auth)
    expect(r.find((u) => u.id === "1")?.status).toBe("ativo")
    expect(r.find((u) => u.id === "2")?.status).toBe("pendente")
  })

  it("marca pendente quando não há auth_user_id ou não há match no Auth", () => {
    const r = combinarStatus(base, [])
    expect(r.find((u) => u.id === "3")?.status).toBe("pendente")
    expect(r.find((u) => u.id === "1")?.status).toBe("pendente")
  })
})

describe("montarLinkConfirmacao", () => {
  it("monta o link para /auth/confirm com token, type e next", () => {
    const link = montarLinkConfirmacao({
      origin: "https://app.exemplo.com",
      hashedToken: "abc123",
      type: "invite",
    })
    const url = new URL(link)
    expect(url.origin).toBe("https://app.exemplo.com")
    expect(url.pathname).toBe("/auth/confirm")
    expect(url.searchParams.get("token_hash")).toBe("abc123")
    expect(url.searchParams.get("type")).toBe("invite")
    expect(url.searchParams.get("next")).toBe("/definir-senha")
  })

  it("aceita type recovery e next customizado", () => {
    const link = montarLinkConfirmacao({
      origin: "http://localhost:3000",
      hashedToken: "t",
      type: "recovery",
      next: "/definir-senha",
    })
    expect(new URL(link).searchParams.get("type")).toBe("recovery")
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"

const { requirePerfil, generateLink, queryRaw } = vi.hoisted(() => ({
  requirePerfil: vi.fn(),
  generateLink: vi.fn(),
  queryRaw: vi.fn(),
}))
vi.mock("@/lib/route-auth", () => ({ requirePerfil }))
vi.mock("@/lib/supabase/admin", () => ({
  criarSupabaseAdmin: () => ({ auth: { admin: { generateLink } } }),
}))
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: queryRaw } }))

import { POST } from "@/app/api/admin/convite/route"

function req(body: unknown) {
  return new Request("http://localhost/api/admin/convite", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })
}

beforeEach(() => { requirePerfil.mockReset(); generateLink.mockReset(); queryRaw.mockReset() })

describe("POST /api/admin/convite", () => {
  it("403 quando não é admin", async () => {
    requirePerfil.mockResolvedValue({ ok: false, response: Response.json({ error: "Acesso negado." }, { status: 403 }) })
    const res = await POST(req({ email: "novo@x.com", nome: "Novo", perfil: "socio" }))
    expect(res.status).toBe(403)
  })

  it("422 com corpo inválido", async () => {
    requirePerfil.mockResolvedValue({ ok: true, usuario: { perfil: "admin" } })
    const res = await POST(req({ email: "nao-email", nome: "", perfil: "chefe" }))
    expect(res.status).toBe(422)
  })

  it("gera link e cria a linha usuario (201) devolvendo id + link", async () => {
    requirePerfil.mockResolvedValue({ ok: true, usuario: { perfil: "admin" } })
    generateLink.mockResolvedValue({
      data: { user: { id: "uid-novo" }, properties: { hashed_token: "hash-abc" } },
      error: null,
    })
    queryRaw.mockResolvedValue([{ id: 42n }])
    const res = await POST(req({ email: "novo@x.com", nome: "Novo", perfil: "socio" }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe("42")
    expect(new URL(body.link).searchParams.get("token_hash")).toBe("hash-abc")
    expect(new URL(body.link).searchParams.get("type")).toBe("invite")
    expect(generateLink).toHaveBeenCalledWith({ type: "invite", email: "novo@x.com" })
  })

  it("502 quando o Supabase falha", async () => {
    requirePerfil.mockResolvedValue({ ok: true, usuario: { perfil: "admin" } })
    generateLink.mockResolvedValue({ data: { user: null, properties: null }, error: { message: "erro" } })
    const res = await POST(req({ email: "novo@x.com", nome: "Novo", perfil: "socio" }))
    expect(res.status).toBe(502)
  })
})

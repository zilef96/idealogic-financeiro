import { describe, it, expect, vi, beforeEach } from "vitest"

const { requirePerfil, generateLink, buscarUsuarioPorId } = vi.hoisted(() => ({
  requirePerfil: vi.fn(),
  generateLink: vi.fn(),
  buscarUsuarioPorId: vi.fn(),
}))
vi.mock("@/lib/route-auth", () => ({ requirePerfil }))
vi.mock("@/lib/supabase/admin", () => ({
  criarSupabaseAdmin: () => ({ auth: { admin: { generateLink } } }),
}))
vi.mock("@/lib/repositories/usuario-repository", () => ({ buscarUsuarioPorId }))

import { POST } from "@/app/api/admin/usuarios/[id]/link/route"

function ctx(id: string) {
  return { params: Promise.resolve({ id }) }
}
function req() {
  return new Request("http://localhost/api/admin/usuarios/5/link", { method: "POST" })
}

beforeEach(() => { requirePerfil.mockReset(); generateLink.mockReset(); buscarUsuarioPorId.mockReset() })

describe("POST /api/admin/usuarios/[id]/link", () => {
  it("403 quando não é admin", async () => {
    requirePerfil.mockResolvedValue({ ok: false, response: Response.json({ error: "Acesso negado." }, { status: 403 }) })
    const res = await POST(req(), ctx("5"))
    expect(res.status).toBe(403)
  })

  it("400 com id inválido", async () => {
    requirePerfil.mockResolvedValue({ ok: true, usuario: { perfil: "admin" } })
    const res = await POST(req(), ctx("abc"))
    expect(res.status).toBe(400)
  })

  it("404 quando usuário não existe", async () => {
    requirePerfil.mockResolvedValue({ ok: true, usuario: { perfil: "admin" } })
    buscarUsuarioPorId.mockResolvedValue(null)
    const res = await POST(req(), ctx("5"))
    expect(res.status).toBe(404)
  })

  it("gera novo link recovery (200)", async () => {
    requirePerfil.mockResolvedValue({ ok: true, usuario: { perfil: "admin" } })
    buscarUsuarioPorId.mockResolvedValue({ id: 5n, email: "b@x.com", nome: "B", perfil: "socio", is_ativo: true, auth_user_id: "uid" })
    generateLink.mockResolvedValue({ data: { properties: { hashed_token: "novo-hash" } }, error: null })
    const res = await POST(req(), ctx("5"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(new URL(body.link).searchParams.get("type")).toBe("recovery")
    expect(new URL(body.link).searchParams.get("token_hash")).toBe("novo-hash")
    expect(generateLink).toHaveBeenCalledWith({ type: "recovery", email: "b@x.com" })
  })

  it("502 quando o Supabase falha", async () => {
    requirePerfil.mockResolvedValue({ ok: true, usuario: { perfil: "admin" } })
    buscarUsuarioPorId.mockResolvedValue({ id: 5n, email: "b@x.com", nome: "B", perfil: "socio", is_ativo: true, auth_user_id: "uid" })
    generateLink.mockResolvedValue({ data: { properties: null }, error: { message: "erro" } })
    const res = await POST(req(), ctx("5"))
    expect(res.status).toBe(502)
  })
})

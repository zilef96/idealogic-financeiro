import { describe, it, expect, vi, beforeEach } from "vitest"

const { getUser, updateUser } = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateUser: vi.fn(),
}))
vi.mock("@/lib/supabase/server", () => ({
  criarSupabaseServer: async () => ({ auth: { getUser, updateUser } }),
}))

import { POST } from "@/app/api/auth/senha/route"

function req(body: unknown) {
  return new Request("http://localhost/api/auth/senha", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })
}

beforeEach(() => { getUser.mockReset(); updateUser.mockReset() })

describe("POST /api/auth/senha", () => {
  it("422 com senha curta", async () => {
    const res = await POST(req({ senha: "curta" }))
    expect(res.status).toBe(422)
  })

  it("401 sem sessão", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await POST(req({ senha: "senha-valida-123" }))
    expect(res.status).toBe(401)
  })

  it("define a senha do usuário logado", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "uid-1" } }, error: null })
    updateUser.mockResolvedValue({ data: {}, error: null })
    const res = await POST(req({ senha: "senha-valida-123" }))
    expect(res.status).toBe(200)
    expect(updateUser).toHaveBeenCalledWith({ password: "senha-valida-123" })
  })

  it("502 quando o Supabase recusa a troca", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "uid-1" } }, error: null })
    updateUser.mockResolvedValue({ data: null, error: { message: "weak" } })
    const res = await POST(req({ senha: "senha-valida-123" }))
    expect(res.status).toBe(502)
  })
})

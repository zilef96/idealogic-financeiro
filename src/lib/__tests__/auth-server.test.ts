import { describe, it, expect, vi, beforeEach } from "vitest"

const { getUser, buscarUsuarioPorAuthId } = vi.hoisted(() => ({
  getUser: vi.fn(),
  buscarUsuarioPorAuthId: vi.fn(),
}))
vi.mock("@/lib/supabase/server", () => ({
  criarSupabaseServer: async () => ({ auth: { getUser } }),
}))
vi.mock("@/lib/repositories/usuario-repository", () => ({ buscarUsuarioPorAuthId }))

import { getUsuario } from "@/lib/auth-server"

beforeEach(() => { getUser.mockReset(); buscarUsuarioPorAuthId.mockReset() })

describe("getUsuario (ponte Supabase → usuario)", () => {
  it("retorna Sessao com perfil vindo da tabela usuario", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "uid-1", email: "a@b.com" } }, error: null })
    buscarUsuarioPorAuthId.mockResolvedValue({ id: BigInt(9), nome: "Ana", perfil: "admin", email: "a@b.com" })
    const s = await getUsuario()
    expect(s).toEqual({ sub: "uid-1", email: "a@b.com", perfil: "admin", nome: "Ana" })
    expect(buscarUsuarioPorAuthId).toHaveBeenCalledWith("uid-1")
  })

  it("retorna null sem sessão Supabase", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await getUsuario()).toBeNull()
  })

  it("retorna null se o auth user não tem linha em usuario", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "uid-x", email: "x@b.com" } }, error: null })
    buscarUsuarioPorAuthId.mockResolvedValue(null)
    expect(await getUsuario()).toBeNull()
  })
})

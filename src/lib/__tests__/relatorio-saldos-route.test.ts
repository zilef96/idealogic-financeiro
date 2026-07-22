import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"

vi.mock("@/lib/route-auth", () => ({ requirePerfil: vi.fn() }))
vi.mock("@/lib/repositories/parametro-repository", () => ({ gravarSaldosBancarios: vi.fn() }))

import { requirePerfil } from "@/lib/route-auth"
import { gravarSaldosBancarios } from "@/lib/repositories/parametro-repository"
import { POST } from "@/app/api/relatorio/saldos/route"

const okAuth = { ok: true, usuario: { perfil: "admin" } } as never
const denyAuth = { ok: false, response: NextResponse.json({ error: "Acesso negado." }, { status: 403 }) } as never

function req(body: unknown) {
  return new Request("http://x/api/relatorio/saldos", {
    method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" },
  })
}

beforeEach(() => vi.clearAllMocks())

describe("POST /api/relatorio/saldos", () => {
  it("403 quando não é admin", async () => {
    vi.mocked(requirePerfil).mockResolvedValue(denyAuth)
    const res = await POST(req({ ano: 2026, mes: 5, saldoSicrediCc: 1, saldoSicrediAplicacao: 2, saldoBanrisulCc: 3 }))
    expect(res.status).toBe(403)
    expect(gravarSaldosBancarios).not.toHaveBeenCalled()
  })
  it("422 quando o schema é inválido (saldo negativo)", async () => {
    vi.mocked(requirePerfil).mockResolvedValue(okAuth)
    const res = await POST(req({ ano: 2026, mes: 5, saldoSicrediCc: -1, saldoSicrediAplicacao: 2, saldoBanrisulCc: 3 }))
    expect(res.status).toBe(422)
    expect(gravarSaldosBancarios).not.toHaveBeenCalled()
  })
  it("200 no caminho feliz e grava os 3 saldos", async () => {
    vi.mocked(requirePerfil).mockResolvedValue(okAuth)
    vi.mocked(gravarSaldosBancarios).mockResolvedValue(undefined)
    const res = await POST(req({ ano: 2026, mes: 5, saldoSicrediCc: 10, saldoSicrediAplicacao: 20, saldoBanrisulCc: 30 }))
    expect(res.status).toBe(200)
    expect(gravarSaldosBancarios).toHaveBeenCalledWith(2026, 5, { sicrediCc: 10, sicrediAplicacao: 20, banrisulCc: 30 })
  })
})

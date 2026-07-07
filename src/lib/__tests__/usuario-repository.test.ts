import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { prisma } from "@/lib/prisma"
import { buscarUsuarioPorAuthId, listarUsuarios, buscarUsuarioPorId } from "@/lib/repositories/usuario-repository"

const AUTH_ID = "00000000-0000-0000-0000-0000000000aa"

describe("buscarUsuarioPorAuthId", () => {
  beforeAll(async () => {
    await prisma.$executeRaw`
      INSERT INTO usuario (nome, email, perfil, is_ativo, auth_user_id)
      VALUES ('Teste Auth', 'teste-auth@example.com', 'admin', true, ${AUTH_ID}::uuid)
    `
  })
  afterAll(async () => {
    await prisma.$executeRaw`DELETE FROM usuario WHERE auth_user_id = ${AUTH_ID}::uuid`
    await prisma.$disconnect()
  })

  it("encontra usuário ativo pelo auth_user_id", async () => {
    const u = await buscarUsuarioPorAuthId(AUTH_ID)
    expect(u?.perfil).toBe("admin")
    expect(u?.email).toBe("teste-auth@example.com")
  })

  it("retorna null para auth_user_id inexistente", async () => {
    const u = await buscarUsuarioPorAuthId("00000000-0000-0000-0000-0000000000bb")
    expect(u).toBeNull()
  })
})

describe("listarUsuarios / buscarUsuarioPorId", () => {
  const EMAIL = "lista-teste@example.com"
  const AID = "00000000-0000-0000-0000-0000000000cc"
  let id = 0

  beforeAll(async () => {
    const rows = await prisma.$queryRaw<{ id: bigint }[]>`
      INSERT INTO usuario (nome, email, perfil, is_ativo, auth_user_id)
      VALUES ('Lista Teste', ${EMAIL}, 'socio', true, ${AID}::uuid)
      RETURNING id
    `
    id = Number(rows[0].id)
  })
  afterAll(async () => {
    await prisma.$executeRaw`DELETE FROM usuario WHERE email = ${EMAIL}`
    await prisma.$disconnect()
  })

  it("listarUsuarios inclui a linha inserida com id string", async () => {
    const todos = await listarUsuarios()
    const achado = todos.find((u) => u.email === EMAIL)
    expect(achado).toBeDefined()
    expect(achado?.id).toBe(String(id))
    expect(achado?.auth_user_id).toBe(AID)
  })

  it("buscarUsuarioPorId encontra pelo id numérico", async () => {
    const u = await buscarUsuarioPorId(id)
    expect(u?.email).toBe(EMAIL)
  })

  it("buscarUsuarioPorId retorna null para id inexistente", async () => {
    const u = await buscarUsuarioPorId(999999999)
    expect(u).toBeNull()
  })
})

import { prisma } from "@/lib/prisma"

export interface UsuarioRow {
  id: bigint; nome: string; email: string; perfil: string
  is_ativo: boolean; auth_user_id: string | null
}

export async function buscarUsuarioPorAuthId(authUserId: string): Promise<UsuarioRow | null> {
  const rows = await prisma.$queryRaw<UsuarioRow[]>`
    SELECT id, nome, email, perfil, is_ativo, auth_user_id
    FROM usuario WHERE auth_user_id = ${authUserId}::uuid AND is_ativo = true LIMIT 1
  `
  return rows[0] ?? null
}

export interface UsuarioLista {
  id: string
  nome: string
  email: string
  perfil: string
  auth_user_id: string | null
}

export async function listarUsuarios(): Promise<UsuarioLista[]> {
  const rows = await prisma.$queryRaw<UsuarioRow[]>`
    SELECT id, nome, email, perfil, is_ativo, auth_user_id
    FROM usuario ORDER BY nome
  `
  return rows.map((r) => ({
    id: String(r.id),
    nome: r.nome,
    email: r.email,
    perfil: r.perfil,
    auth_user_id: r.auth_user_id,
  }))
}

export async function buscarUsuarioPorId(id: number): Promise<UsuarioRow | null> {
  const rows = await prisma.$queryRaw<UsuarioRow[]>`
    SELECT id, nome, email, perfil, is_ativo, auth_user_id
    FROM usuario WHERE id = ${id} LIMIT 1
  `
  return rows[0] ?? null
}

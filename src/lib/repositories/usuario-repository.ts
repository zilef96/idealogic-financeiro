import { prisma } from "@/lib/prisma"

export interface UsuarioRow {
  id: bigint; nome: string; email: string; perfil: string; senha_hash: string; is_ativo: boolean
}

export async function buscarUsuarioPorEmail(email: string): Promise<UsuarioRow | null> {
  const rows = await prisma.$queryRaw<UsuarioRow[]>`
    SELECT id, nome, email, perfil, senha_hash, is_ativo
    FROM usuario WHERE lower(email) = lower(${email}) AND is_ativo = true LIMIT 1
  `
  return rows[0] ?? null
}

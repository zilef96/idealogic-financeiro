// Regra pura: sem acesso a banco nem à rede.

export type StatusUsuario = "pendente" | "ativo"

export interface UsuarioBase {
  id: string
  nome: string
  email: string
  perfil: string
  auth_user_id: string | null
}

export interface UsuarioComStatus {
  id: string
  nome: string
  email: string
  perfil: string
  status: StatusUsuario
}

export interface AuthUserLite {
  id: string
  last_sign_in_at: string | null
}

// Cruza a tabela usuario com os usuários do Supabase Auth.
// "ativo" = já entrou ao menos uma vez (last_sign_in_at preenchido); caso
// contrário "pendente" (ainda não definiu a senha / nunca logou).
export function combinarStatus(
  usuarios: UsuarioBase[],
  authUsers: AuthUserLite[],
): UsuarioComStatus[] {
  const porId = new Map(authUsers.map((a) => [a.id, a]))
  return usuarios.map((u) => {
    const auth = u.auth_user_id ? porId.get(u.auth_user_id) : undefined
    const status: StatusUsuario = auth?.last_sign_in_at ? "ativo" : "pendente"
    return { id: u.id, nome: u.nome, email: u.email, perfil: u.perfil, status }
  })
}

// Monta o link de aterrissagem que /auth/confirm sabe consumir (verifyOtp).
export function montarLinkConfirmacao(p: {
  origin: string
  hashedToken: string
  type: "invite" | "recovery"
  next?: string
}): string {
  const url = new URL("/auth/confirm", p.origin)
  url.searchParams.set("token_hash", p.hashedToken)
  url.searchParams.set("type", p.type)
  url.searchParams.set("next", p.next ?? "/definir-senha")
  return url.toString()
}

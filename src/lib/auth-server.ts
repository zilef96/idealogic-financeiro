import { redirect } from "next/navigation"
import { criarSupabaseServer } from "@/lib/supabase/server"
import { buscarUsuarioPorAuthId } from "@/lib/repositories/usuario-repository"
import { podeAcessar, type Perfil } from "@/lib/auth"

export interface Sessao { sub: string; email: string; perfil: Perfil; nome: string }

// Ponte central de sessão: identidade vem do Supabase; o PAPEL (RBAC) vem SEMPRE
// da tabela usuario, buscado por auth_user_id no request — nunca de claim do token.
export async function getUsuario(): Promise<Sessao | null> {
  const supabase = await criarSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const perfilRow = await buscarUsuarioPorAuthId(user.id)
  if (!perfilRow) return null
  return {
    sub: user.id,
    email: perfilRow.email,
    perfil: perfilRow.perfil as Perfil,
    nome: perfilRow.nome,
  }
}

export async function exigirPerfilPagina(permitidos: Perfil[]): Promise<Sessao> {
  const u = await getUsuario()
  if (!u) redirect("/login")
  if (!podeAcessar(u.perfil, permitidos)) redirect("/login?erro=403")
  return u
}

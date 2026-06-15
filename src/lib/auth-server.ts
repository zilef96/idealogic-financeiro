import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { COOKIE, verificarSessao, type Sessao } from "@/lib/session"
import { podeAcessar, type Perfil } from "@/lib/auth"

export async function getUsuario(): Promise<Sessao | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  return verificarSessao(token)
}

export async function exigirPerfilPagina(permitidos: Perfil[]): Promise<Sessao> {
  const u = await getUsuario()
  if (!u) redirect("/login")
  if (!podeAcessar(u.perfil, permitidos)) redirect("/login?erro=403")
  return u
}

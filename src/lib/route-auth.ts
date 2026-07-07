import { NextResponse } from "next/server"
import { getUsuario, type Sessao } from "@/lib/auth-server"
import { podeAcessar, type Perfil } from "@/lib/auth"

type Resultado = { ok: true; usuario: Sessao } | { ok: false; response: NextResponse }

export async function requirePerfil(permitidos: Perfil[]): Promise<Resultado> {
  const u = await getUsuario()
  if (!u) return { ok: false, response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) }
  if (!podeAcessar(u.perfil, permitidos)) {
    return { ok: false, response: NextResponse.json({ error: "Acesso negado." }, { status: 403 }) }
  }
  return { ok: true, usuario: u }
}

import { NextResponse } from "next/server"
import { z } from "zod"
import { parseBody, handleApiError } from "@/lib/api-helpers"
import { criarSupabaseServer } from "@/lib/supabase/server"
import { buscarUsuarioPorAuthId } from "@/lib/repositories/usuario-repository"

const schema = z.object({ email: z.email(), senha: z.string().min(1) })

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema)
  if (!parsed.ok) return parsed.response
  try {
    const supabase = await criarSupabaseServer()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.senha,
    })
    if (error || !data.user) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 })
    }
    const perfilRow = await buscarUsuarioPorAuthId(data.user.id)
    if (!perfilRow) {
      // autenticou no Supabase mas não tem perfil no app → sem acesso.
      await supabase.auth.signOut()
      return NextResponse.json({ error: "Usuário sem perfil ativo." }, { status: 403 })
    }
    // signInWithPassword já gravou os cookies de sessão via o adaptador do server client.
    return NextResponse.json({ perfil: perfilRow.perfil, nome: perfilRow.nome })
  } catch (e) {
    return handleApiError(e, "Falha no login.")
  }
}

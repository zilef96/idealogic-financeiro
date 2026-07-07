import { NextResponse } from "next/server"
import { z } from "zod"
import { parseBody, handleApiError } from "@/lib/api-helpers"
import { criarSupabaseServer } from "@/lib/supabase/server"

const schema = z.object({ senha: z.string().min(8) })

// Define a senha do usuário logado (sessão provisória do convite ou reset).
// Exige apenas sessão Supabase — o convidado ainda está definindo a credencial.
export async function POST(req: Request) {
  const parsed = await parseBody(req, schema)
  if (!parsed.ok) return parsed.response
  try {
    const supabase = await criarSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }
    const { error } = await supabase.auth.updateUser({ password: parsed.data.senha })
    if (error) {
      return NextResponse.json({ error: "Falha ao definir a senha." }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e, "Falha ao definir a senha.")
  }
}

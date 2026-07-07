import { NextResponse } from "next/server"
import { requirePerfil } from "@/lib/route-auth"
import { handleApiError, idPositivoSchema } from "@/lib/api-helpers"
import { criarSupabaseAdmin } from "@/lib/supabase/admin"
import { buscarUsuarioPorId } from "@/lib/repositories/usuario-repository"
import { montarLinkConfirmacao } from "@/lib/services/usuario-service"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const { id } = await params
  const pid = idPositivoSchema.safeParse(id)
  if (!pid.success) return NextResponse.json({ error: "id inválido." }, { status: 400 })
  try {
    const usuario = await buscarUsuarioPorId(pid.data)
    if (!usuario) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })
    const supabase = criarSupabaseAdmin()
    // Usuário já existe no Auth → recovery gera novo link para redefinir/definir senha.
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: usuario.email,
    })
    if (error || !data.properties?.hashed_token) {
      return NextResponse.json({ error: "Falha ao gerar o link." }, { status: 502 })
    }
    const link = montarLinkConfirmacao({
      origin: new URL(req.url).origin,
      hashedToken: data.properties.hashed_token,
      type: "recovery",
    })
    return NextResponse.json({ ok: true, link })
  } catch (e) {
    return handleApiError(e, "Falha ao gerar o link.")
  }
}

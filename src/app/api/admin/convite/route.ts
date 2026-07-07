import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseBody, handleApiError } from "@/lib/api-helpers"
import { criarSupabaseAdmin } from "@/lib/supabase/admin"
import { montarLinkConfirmacao } from "@/lib/services/usuario-service"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  email: z.email(),
  nome: z.string().min(1),
  perfil: z.enum(["admin", "socio"]),
})

export async function POST(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = await parseBody(req, schema)
  if (!parsed.ok) return parsed.response
  try {
    const supabase = criarSupabaseAdmin()
    // generateLink (type invite) cria a conta e devolve o token SEM enviar e-mail.
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "invite",
      email: parsed.data.email,
    })
    if (error || !data.user || !data.properties?.hashed_token) {
      return NextResponse.json({ error: "Falha ao gerar o link." }, { status: 502 })
    }
    const rows = await prisma.$queryRaw<{ id: bigint }[]>`
      INSERT INTO usuario (nome, email, perfil, is_ativo, auth_user_id)
      VALUES (${parsed.data.nome}, ${parsed.data.email}, ${parsed.data.perfil}, true, ${data.user.id}::uuid)
      ON CONFLICT (email) DO UPDATE
        SET auth_user_id = EXCLUDED.auth_user_id, perfil = EXCLUDED.perfil, nome = EXCLUDED.nome, is_ativo = true
      RETURNING id
    `
    const link = montarLinkConfirmacao({
      origin: new URL(req.url).origin,
      hashedToken: data.properties.hashed_token,
      type: "invite",
    })
    return NextResponse.json({ ok: true, id: String(rows[0].id), link }, { status: 201 })
  } catch (e) {
    return handleApiError(e, "Falha ao convidar usuário.")
  }
}

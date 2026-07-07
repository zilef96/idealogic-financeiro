import { NextResponse, type NextRequest } from "next/server"
import { criarSupabaseServer } from "@/lib/supabase/server"
import type { EmailOtpType } from "@supabase/supabase-js"

// Aterrissagem dos links de e-mail do Supabase (convite, reset de senha).
// Troca o token_hash por sessão (cookies) e segue para a tela de definir senha.
// O template de e-mail deve apontar para:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/definir-senha
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/definir-senha"

  const destinoErro = new URL("/login?erro=convite", request.url)
  if (!tokenHash || !type) return NextResponse.redirect(destinoErro)

  const supabase = await criarSupabaseServer()
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
  if (error) return NextResponse.redirect(destinoErro)

  // "next" só pode ser caminho interno (evita open redirect).
  const destino = next.startsWith("/") ? next : "/definir-senha"
  return NextResponse.redirect(new URL(destino, request.url))
}

import { redirect } from "next/navigation"
import { criarSupabaseServer } from "@/lib/supabase/server"
import { FormDefinirSenha } from "@/components/auth/form-definir-senha"
import { Logo } from "@/components/brand/logo"

// Chegada do convite/reset: exige apenas a sessão provisória do Supabase
// (o perfil já existe em usuario, criado no convite).
export default async function DefinirSenhaPage() {
  const supabase = await criarSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?erro=convite")
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex items-center gap-2.5">
          <Logo size={38} />
          <div>
            <p className="font-display text-lg font-bold leading-tight text-ink">Definir senha</p>
            <p className="text-sm text-muted">Crie a senha de acesso para {user.email}.</p>
          </div>
        </div>
        <FormDefinirSenha />
      </div>
    </main>
  )
}

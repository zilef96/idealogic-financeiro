import { redirect } from "next/navigation"
import { criarSupabaseServer } from "@/lib/supabase/server"
import { FormDefinirSenha } from "@/components/auth/form-definir-senha"

// Chegada do convite/reset: exige apenas a sessão provisória do Supabase
// (o perfil já existe em usuario, criado no convite).
export default async function DefinirSenhaPage() {
  const supabase = await criarSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?erro=convite")
  return (
    <main className="mx-auto max-w-sm space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Definir senha</h1>
        <p className="text-sm text-muted">Crie a senha de acesso para {user.email}.</p>
      </div>
      <FormDefinirSenha />
    </main>
  )
}

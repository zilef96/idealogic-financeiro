import { exigirPerfilPagina } from "@/lib/auth-server"
import { listarUsuarios } from "@/lib/repositories/usuario-repository"
import { combinarStatus, type AuthUserLite } from "@/lib/services/usuario-service"
import { criarSupabaseAdmin } from "@/lib/supabase/admin"
import { ListaUsuarios } from "@/components/admin/lista-usuarios"

export default async function UsuariosPage() {
  await exigirPerfilPagina(["admin"])

  const usuarios = await listarUsuarios()
  const supabase = criarSupabaseAdmin()
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const authUsers: AuthUserLite[] = (data?.users ?? []).map((u) => ({
    id: u.id,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }))

  const linhas = combinarStatus(usuarios, authUsers)

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <p className="text-sm text-muted">
          Adicione usuários e gere o link de acesso para enviar manualmente.
        </p>
      </div>
      <ListaUsuarios usuarios={linhas} />
    </main>
  )
}

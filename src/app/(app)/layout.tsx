import { redirect } from "next/navigation"
import { AppShell } from "@/components/shell/app-shell"
import { getUsuario } from "@/lib/auth-server"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await getUsuario()
  if (!sessao) redirect("/login")
  const usuario = { nome: sessao.nome, email: sessao.email, perfil: sessao.perfil }
  return <AppShell usuario={usuario}>{children}</AppShell>
}

import { redirect } from "next/navigation"

// A raiz não tem tela própria: manda para a Dashboard, única área acessível
// aos dois perfis (admin e socio). A sessão já é exigida no layout do grupo.
export default function Home() {
  redirect("/dashboard")
}

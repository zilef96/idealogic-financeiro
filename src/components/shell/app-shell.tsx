"use client"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Calculator, FileCog, LayoutDashboard, ListTodo, Menu, type LucideIcon } from "lucide-react"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { UserMenu } from "@/components/shell/user-menu"
import { Logo } from "@/components/brand/logo"

type UsuarioShell = { nome: string; email: string; perfil: "socio" | "admin" }

type ItemMenu = { href: string; label: string; icon: LucideIcon }

const ITENS_ADMIN: ItemMenu[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orcamento", label: "Orçamentação", icon: Calculator },
  { href: "/execucao", label: "Execução", icon: ListTodo },
  { href: "/parametros", label: "Parâmetros", icon: FileCog },
]

const ITENS_SOCIO: ItemMenu[] = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }]

export function AppShell({
  children,
  usuario,
}: {
  children: React.ReactNode
  usuario: UsuarioShell | null
}) {
  const [aberto, setAberto] = useState(false)
  const pathname = usePathname()
  const itens = usuario?.perfil === "admin" ? ITENS_ADMIN : ITENS_SOCIO
  return (
    <div className="min-h-screen xl:grid xl:grid-cols-[16rem_1fr]">
      {/* Sidebar: drawer no mobile/tablet, fixa só no desktop largo (≥xl) para dar largura total à tabela */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-background
          transition-transform xl:static xl:translate-x-0
          ${aberto ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Cabeçalho da marca */}
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
          <Logo size={28} />
          <span className="font-display text-base font-semibold tracking-tight">Idealogic</span>
        </div>
        <nav className="flex-1 space-y-1 p-3 text-sm" aria-label="Navegação principal">
          {itens.map((item) => {
            const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icone = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                onClick={() => setAberto(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors
                  ${
                    ativo
                      ? "bg-foreground text-background"
                      : "text-muted hover:bg-muted/10 hover:text-foreground"
                  }`}
              >
                <Icone size={18} strokeWidth={2} aria-hidden />
                {item.label}
              </a>
            )
          })}
        </nav>
      </aside>
      {aberto && (
        <div className="fixed inset-0 z-30 bg-black/40 xl:hidden" onClick={() => setAberto(false)} />
      )}
      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="flex items-center justify-between border-b border-border p-3">
          <button
            type="button" className="xl:hidden rounded-md border border-border p-2"
            aria-label="Abrir menu" onClick={() => setAberto(true)}
          ><Menu size={18} strokeWidth={2} aria-hidden /></button>
          <span className="font-semibold">Dashboard Financeiro</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {usuario && <UserMenu usuario={usuario} />}
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4">{children}</main>
      </div>
    </div>
  )
}

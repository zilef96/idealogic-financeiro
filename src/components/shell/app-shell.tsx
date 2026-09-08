"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calculator, FileText, LayoutDashboard, ListTodo, Home, Share2, BarChart3, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { UserMenu } from "@/components/shell/user-menu"
import { Logo } from "@/components/brand/logo"
import { RobotIcon } from "@/components/shell/robot-icon"

type UsuarioShell = { nome: string; email: string; perfil: "socio" | "admin" }

type ItemMenu = { href: string; label: string; icon: LucideIcon }

// Itens que levam de volta pro hub (app separado, servido em outro caminho —
// por isso âncora simples, não next/link, que prefixaria com o basePath daqui).
const ITENS_HUB: ItemMenu[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/post", label: "Redes Sociais", icon: Share2 },
]
const ITENS_HUB_DEPOIS: ItemMenu[] = [
  { href: "/relatorio-mensal", label: "Relatório Mensal", icon: BarChart3 },
]

const ITENS_ADMIN: ItemMenu[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orcamento", label: "Orçamentação", icon: Calculator },
  { href: "/execucao", label: "Execução", icon: ListTodo },
  { href: "/relatorio", label: "Relatório", icon: FileText },
]

const ITENS_SOCIO: ItemMenu[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/relatorio", label: "Relatório", icon: FileText },
]

const COLLAPSE_KEY = "idealogic-sidebar-collapsed"

export function AppShell({
  children,
  usuario,
}: {
  children: React.ReactNode
  usuario: UsuarioShell | null
}) {
  const [recolhido, setRecolhido] = useState(false)
  const [hidratado, setHidratado] = useState(false)
  const pathname = usePathname()
  const itensFinanceiro = usuario?.perfil === "admin" ? ITENS_ADMIN : ITENS_SOCIO

  useEffect(() => {
    // Lê o localStorage só depois do mount pra evitar mismatch de hidratação
    // (servidor não tem acesso a ele) — daí o gate `hidratado` na alça abaixo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecolhido(localStorage.getItem(COLLAPSE_KEY) === "1")
    setHidratado(true)
  }, [])

  function alternarRecolhido() {
    setRecolhido((v) => {
      const proximo = !v
      localStorage.setItem(COLLAPSE_KEY, proximo ? "1" : "0")
      return proximo
    })
  }

  function ItemNav({ item, ativo, comAncoraSimples }: { item: ItemMenu; ativo: boolean; comAncoraSimples?: boolean }) {
    const Icone = item.icon
    const conteudo = (
      <>
        {ativo && !recolhido && (
          <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-[3px]" style={{ background: "rgb(var(--teal))" }} />
        )}
        <Icone size={18} strokeWidth={1.75} aria-hidden color={ativo ? "rgb(var(--teal))" : undefined} />
        {!recolhido && item.label}
      </>
    )
    const className = "relative flex h-[38px] items-center gap-2.5 rounded-[10px] px-3 text-[13.5px] font-medium transition-colors"
    const style = {
      justifyContent: recolhido ? "center" : "flex-start",
      background: ativo ? "rgb(var(--teal) / 0.10)" : "transparent",
      color: ativo ? "rgb(var(--ink))" : "rgb(var(--muted))",
      fontWeight: ativo ? 600 : 500,
    } as const
    if (comAncoraSimples) {
      return (
        <a key={item.href} href={item.href} title={recolhido ? item.label : undefined} className={className} style={style}>
          {conteudo}
        </a>
      )
    }
    return (
      <a
        key={item.href}
        href={item.href}
        title={recolhido ? item.label : undefined}
        aria-current={ativo ? "page" : undefined}
        className={className}
        style={style}
      >
        {conteudo}
      </a>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-2.5 border-b border-border bg-background px-4 py-3">
        <Logo size={28} />
        <span className="font-display text-base font-semibold tracking-tight">Idealogic</span>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <span className="text-[12.5px] font-medium text-muted">Financeiro</span>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {usuario && <UserMenu usuario={usuario} />}
        </div>
      </header>

      <div className="relative flex flex-1 items-stretch">
        {hidratado && (
          <button
            type="button"
            onClick={alternarRecolhido}
            aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
            className="fixed top-1/2 z-30 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted"
            style={{ left: recolhido ? 52 : 228 }}
          >
            {recolhido ? <ChevronRight size={12} strokeWidth={2.2} /> : <ChevronLeft size={12} strokeWidth={2.2} />}
          </button>
        )}

        <aside
          className="flex shrink-0 flex-col overflow-hidden border-r border-border bg-background transition-[width]"
          style={{ width: recolhido ? 64 : 256 }}
        >
          <nav className="flex flex-1 flex-col gap-0.5 p-3 text-sm" aria-label="Navegação principal">
            {ITENS_HUB.map((item) => (
              <ItemNav key={item.href} item={item} ativo={false} comAncoraSimples />
            ))}

            <div
              className="flex h-[38px] items-center gap-2.5 rounded-[10px] px-3 text-[13.5px] font-semibold"
              style={{ justifyContent: recolhido ? "center" : "flex-start", background: "rgb(var(--faint))", color: "rgb(var(--ink))" }}
            >
              <Calculator size={18} strokeWidth={1.75} aria-hidden />
              {!recolhido && "Financeiro"}
            </div>
            <div
              className="flex flex-col gap-px"
              style={{ marginLeft: recolhido ? 0 : 22, paddingLeft: recolhido ? 0 : 12, borderLeft: recolhido ? "none" : "1px solid rgb(var(--border))" }}
            >
              {itensFinanceiro.map((item) => {
                const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icone = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={recolhido ? item.label : undefined}
                    aria-current={ativo ? "page" : undefined}
                    className="flex h-8 items-center gap-2 rounded-[10px] px-2.5 text-[12.5px] font-medium transition-colors"
                    style={{
                      justifyContent: recolhido ? "center" : "flex-start",
                      background: ativo ? "rgb(var(--teal) / 0.10)" : "transparent",
                      color: ativo ? "rgb(var(--ink))" : "rgb(var(--muted))",
                      fontWeight: ativo ? 600 : 500,
                    }}
                  >
                    {!recolhido && <Icone size={15} strokeWidth={1.75} aria-hidden />}
                    {!recolhido && item.label}
                    {recolhido && <Icone size={15} strokeWidth={1.75} aria-hidden />}
                  </Link>
                )
              })}
            </div>

            {ITENS_HUB_DEPOIS.map((item) => (
              <ItemNav key={item.href} item={item} ativo={false} comAncoraSimples />
            ))}
            <a
              href="/claude-code"
              title={recolhido ? "Claude Code" : undefined}
              className="relative flex h-[38px] items-center gap-2.5 rounded-[10px] px-3 text-[13.5px] font-medium text-muted"
              style={{ justifyContent: recolhido ? "center" : "flex-start" }}
            >
              <RobotIcon width={21} height={13} />
              {!recolhido && "Claude Code"}
            </a>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-4">{children}</main>
      </div>
    </div>
  )
}

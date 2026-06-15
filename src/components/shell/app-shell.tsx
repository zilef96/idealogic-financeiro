"use client"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme/theme-toggle"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
      {/* Sidebar: drawer no mobile, fixa no desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-background p-4
          transition-transform md:static md:translate-x-0
          ${aberto ? "translate-x-0" : "-translate-x-full"}`}
      >
        <nav className="space-y-1 text-sm" aria-label="Navegação principal">
          <a className="block rounded px-2 py-1 hover:bg-muted/10" href="/orcamento">Orçamentação</a>
          <a className="block rounded px-2 py-1 hover:bg-muted/10" href="/execucao">Execução</a>
        </nav>
      </aside>
      {aberto && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setAberto(false)} />
      )}
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-border p-3">
          <button
            type="button" className="md:hidden rounded-md border border-border px-2 py-1"
            aria-label="Abrir menu" onClick={() => setAberto(true)}
          >☰</button>
          <span className="font-semibold">Dashboard Financeiro</span>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  )
}

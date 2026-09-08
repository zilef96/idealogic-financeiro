"use client"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { API_BASE } from "@/lib/api-base"

type Perfil = "socio" | "admin"

interface UserMenuProps {
  /** Usuário logado, vindo da sessão (getUsuario() no Server Component pai). */
  usuario: { nome: string; email: string; perfil: Perfil }
}

/** Rótulo de exibição de cada perfil. */
const ROTULO_PERFIL: Record<Perfil, string> = {
  admin: "Admin",
  socio: "Sócio",
}

/** Extrai até duas iniciais do nome (primeira + última palavra). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "?"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

/**
 * Menu de usuário do header: avatar com iniciais que abre um popover com
 * identidade (nome, e-mail, perfil) e a ação de logout. Conviver com o
 * ThemeToggle no canto direito do header.
 */
export function UserMenu({ usuario }: UserMenuProps) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [entrou, setEntrou] = useState(false)
  const [saindo, setSaindo] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const sairRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  const fechar = useCallback((devolverFoco = false) => {
    setAberto(false)
    setEntrou(false)
    if (devolverFoco) gatilhoRef.current?.focus()
  }, [])

  // Anima a entrada do popover no frame seguinte à montagem.
  useEffect(() => {
    if (!aberto) return
    const id = requestAnimationFrame(() => setEntrou(true))
    sairRef.current?.focus()
    return () => cancelAnimationFrame(id)
  }, [aberto])

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return
    function aoClicarFora(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) fechar()
    }
    document.addEventListener("mousedown", aoClicarFora)
    return () => document.removeEventListener("mousedown", aoClicarFora)
  }, [aberto, fechar])

  // Esc fecha e devolve o foco ao gatilho.
  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation()
      fechar(true)
    }
  }

  // Tab para fora do popover (foco deixa o container) também fecha.
  function aoSairFoco(e: React.FocusEvent) {
    if (!containerRef.current?.contains(e.relatedTarget as Node | null)) fechar()
  }

  async function sair() {
    if (saindo) return
    setSaindo(true)
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST" })
      router.push("/login")
    } catch {
      // Permite nova tentativa caso a requisição falhe.
      setSaindo(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={aoTeclar}
      onBlur={aoSairFoco}
    >
      <button
        ref={gatilhoRef}
        type="button"
        onClick={() => (aberto ? fechar() : setAberto(true))}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? menuId : undefined}
        aria-label={`Menu de ${usuario.nome}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border
          font-mono text-xs font-semibold tracking-tight text-foreground
          transition-colors hover:bg-muted/10
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40
          aria-expanded:bg-muted/10"
      >
        {iniciais(usuario.nome)}
      </button>

      {aberto && (
        <div
          id={menuId}
          role="menu"
          aria-label="Opções do usuário"
          className={`absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden
            rounded-xl border border-border bg-background
            shadow-[0_12px_40px_-12px_rgb(var(--foreground)/0.25)]
            transition duration-150 ease-out
            ${entrou ? "translate-y-0 scale-100 opacity-100" : "-translate-y-1 scale-95 opacity-0"}`}
        >
          {/* Cartão de identidade */}
          <div className="flex items-start gap-3 border-b border-border p-4">
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                border border-border bg-muted/10 font-mono text-sm font-semibold text-foreground"
            >
              {iniciais(usuario.nome)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground" title={usuario.nome}>
                {usuario.nome}
              </p>
              <p className="truncate font-mono text-xs text-muted" title={usuario.email}>
                {usuario.email}
              </p>
              <span
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border
                  px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wide text-muted"
              >
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full ${
                    usuario.perfil === "admin" ? "bg-foreground" : "bg-muted"
                  }`}
                />
                {ROTULO_PERFIL[usuario.perfil]}
              </span>
            </div>
          </div>

          {/* Ações */}
          <div className="p-1">
            <button
              ref={sairRef}
              type="button"
              role="menuitem"
              onClick={sair}
              disabled={saindo}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm
                font-medium text-danger transition-colors
                hover:bg-danger/10 focus-visible:bg-danger/10 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saindo ? "Saindo…" : "Sair"}
              <span aria-hidden className="font-mono text-xs opacity-70">
                {saindo ? "···" : "→"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react"

type Ctx = {
  marcarAlterado: (id: string) => void
  limparAlterado: (id: string) => void
  temAlteracoes: () => boolean
  confirmarSeHaAlteracoes: (msg?: string) => boolean
}

const AlteracoesNaoSalvasContext = createContext<Ctx | null>(null)
const MSG_PADRAO = "Há alterações não salvas. Deseja continuar e descartar a edição em andamento?"

export function AlteracoesNaoSalvasProvider({ children }: { children: ReactNode }) {
  const alterados = useRef<Set<string>>(new Set())

  const marcarAlterado = useCallback((id: string) => { alterados.current.add(id) }, [])
  const limparAlterado = useCallback((id: string) => { alterados.current.delete(id) }, [])
  const temAlteracoes = useCallback(() => alterados.current.size > 0, [])
  const confirmarSeHaAlteracoes = useCallback((msg = MSG_PADRAO) => {
    if (alterados.current.size === 0) return true
    const ok = window.confirm(msg)
    if (ok) alterados.current.clear()
    return ok
  }, [])

  useEffect(() => {
    const handler = (ev: BeforeUnloadEvent) => {
      if (alterados.current.size > 0) { ev.preventDefault(); ev.returnValue = "" }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  return (
    <AlteracoesNaoSalvasContext.Provider value={{ marcarAlterado, limparAlterado, temAlteracoes, confirmarSeHaAlteracoes }}>
      {children}
    </AlteracoesNaoSalvasContext.Provider>
  )
}

export function useAlteracoesNaoSalvas(): Ctx {
  const ctx = useContext(AlteracoesNaoSalvasContext)
  if (!ctx) throw new Error("useAlteracoesNaoSalvas deve ser usado dentro de AlteracoesNaoSalvasProvider")
  return ctx
}

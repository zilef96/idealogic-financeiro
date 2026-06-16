"use client"
import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

type TipoToast = "sucesso" | "erro"
interface Toast { id: number; tipo: TipoToast; texto: string }
interface ContextoToast { toast: (t: { tipo: TipoToast; texto: string }) => void }

const Ctx = createContext<ContextoToast | null>(null)

export function useToast(): ContextoToast {
  const c = useContext(Ctx)
  if (!c) throw new Error("useToast precisa estar dentro de <ToastProvider>")
  return c
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<Toast[]>([])

  const remover = useCallback((id: number) => {
    setItens((s) => s.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((t: { tipo: TipoToast; texto: string }) => {
    const id = Date.now() + Math.random()
    setItens((s) => [...s, { id, ...t }])
    setTimeout(() => remover(id), 4000)
  }, [remover])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {itens.map((t) => {
          const cor = t.tipo === "sucesso" ? "--pos" : "--danger"
          return (
            <button key={t.id} type="button" role="status" onClick={() => remover(t.id)}
              className="pointer-events-auto flex items-start gap-2 rounded-xl border bg-card p-3 text-left text-sm shadow-lg"
              style={{ borderColor: `rgb(var(${cor}) / 0.5)` }}>
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[11px] font-bold text-background"
                style={{ background: `rgb(var(${cor}))` }}>{t.tipo === "sucesso" ? "✓" : "!"}</span>
              <span className="flex-1">{t.texto}</span>
            </button>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

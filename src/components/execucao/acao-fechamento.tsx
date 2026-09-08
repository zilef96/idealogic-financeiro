"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { API_BASE } from "@/lib/api-base"

type Status = "aberto" | "concluido"
type Auditoria = { concluidoPor: string | null; concluidoEm: string | null; reabertoPor: string | null; reabertoEm: string | null }

export function AcaoFechamento({ ano, mes, status, auditoria }: { ano: number; mes: number; status: Status; auditoria?: Auditoria }) {
  const router = useRouter()
  const { toast } = useToast()
  const [carregando, setCarregando] = useState(false)
  const [logAberto, setLogAberto] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!logAberto) return
    const onDoc = (ev: MouseEvent) => { if (logRef.current && !logRef.current.contains(ev.target as Node)) setLogAberto(false) }
    const onEsc = (ev: KeyboardEvent) => { if (ev.key === "Escape") setLogAberto(false) }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onEsc)
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc) }
  }, [logAberto])

  const concluido = status === "concluido"
  const rota = concluido ? `${API_BASE}/fechamento/reabrir` : `${API_BASE}/fechamento/concluir`
  const label = concluido ? "Reabrir mês" : "Concluir mês"

  async function acionar() {
    setCarregando(true)
    try {
      const r = await fetch(rota, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano, mes }),
      })
      if (r.ok) {
        router.refresh()
        toast({ tipo: "sucesso", texto: concluido ? "Mês reaberto." : "Mês concluído." })
      } else {
        const corpo = await r.json().catch(() => null)
        const msg = corpo?.error
        toast({ tipo: "erro", texto: typeof msg === "string" ? msg : "Falha ao atualizar a competência." })
      }
    } catch {
      toast({ tipo: "erro", texto: "Sem conexão ao atualizar a competência." })
    } finally {
      setCarregando(false)
    }
  }

  // Histórico de fechamento/reabertura — exibido sob demanda no popover do ⓘ.
  const eventos: { tipo: "concluido" | "reaberto"; quem: string; quando: string | null }[] = []
  if (auditoria?.concluidoPor) eventos.push({ tipo: "concluido", quem: auditoria.concluidoPor, quando: auditoria.concluidoEm })
  if (auditoria?.reabertoPor) eventos.push({ tipo: "reaberto", quem: auditoria.reabertoPor, quando: auditoria.reabertoEm })

  const corSelo = concluido ? "--danger" : "--pos"
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
      <span className="flex items-center gap-2 text-sm">
        <span className="h-2 w-2 rounded-full" style={{ background: `rgb(var(${corSelo}))` }} aria-hidden />
        Competência {concluido ? "concluída" : "aberta"}
        {eventos.length > 0 && (
          <span ref={logRef} className="relative inline-flex">
            <button type="button" aria-haspopup="dialog" aria-expanded={logAberto}
              aria-label="Histórico da competência" onClick={() => setLogAberto((v) => !v)}
              className="grid h-4 w-4 cursor-pointer place-items-center rounded-full border border-border text-[10px] leading-none"
              style={{ color: "rgb(var(--muted))" }}>i</button>
            {logAberto && (
              <div role="dialog" aria-label="Histórico da competência"
                className="absolute left-1/2 top-6 z-50 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-border bg-card p-3 text-[12px] shadow-lg">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>Histórico da competência</div>
                <ul className="space-y-1.5">
                  {eventos.map((ev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: ev.tipo === "concluido" ? "rgb(var(--pos))" : "rgb(var(--amber))" }} aria-hidden />
                      <span>
                        {ev.tipo === "concluido" ? "Concluído" : "Reaberto"} por <strong>{ev.quem}</strong>
                        {ev.quando ? <> · {new Date(ev.quando).toLocaleString("pt-BR")}</> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </span>
        )}
      </span>
      <button type="button" onClick={acionar} disabled={carregando}
        className="rounded-[10px] border border-border bg-card px-4 py-1.5 text-[13px] font-medium hover:bg-faint disabled:opacity-60">
        {carregando ? "Processando…" : label}
      </button>
    </div>
  )
}

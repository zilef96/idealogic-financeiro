"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"

type Status = "aberto" | "concluido"
type Auditoria = { concluidoPor: string | null; concluidoEm: string | null; reabertoPor: string | null; reabertoEm: string | null }

export function AcaoFechamento({ ano, mes, status, auditoria }: { ano: number; mes: number; status: Status; auditoria?: Auditoria }) {
  const router = useRouter()
  const { toast } = useToast()
  const [carregando, setCarregando] = useState(false)

  const concluido = status === "concluido"
  const rota = concluido ? "/api/fechamento/reabrir" : "/api/fechamento/concluir"
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

  // Histórico de fechamento/reabertura — informação extra, exibida só no tooltip do ⓘ.
  const historico = !auditoria ? "" : [
    auditoria.concluidoPor && `Concluído por ${auditoria.concluidoPor}${auditoria.concluidoEm ? ` em ${new Date(auditoria.concluidoEm).toLocaleString("pt-BR")}` : ""}`,
    auditoria.reabertoPor && `Reaberto por ${auditoria.reabertoPor}${auditoria.reabertoEm ? ` em ${new Date(auditoria.reabertoEm).toLocaleString("pt-BR")}` : ""}`,
  ].filter(Boolean).join("\n")

  const corSelo = concluido ? "--danger" : "--pos"
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
      <span className="flex items-center gap-2 text-sm">
        <span className="h-2 w-2 rounded-full" style={{ background: `rgb(var(${corSelo}))` }} aria-hidden />
        Competência {concluido ? "concluída" : "aberta"}
        {historico && (
          <span tabIndex={0} role="note" aria-label={`Histórico do mês. ${historico}`} title={historico}
            className="grid h-4 w-4 cursor-help place-items-center rounded-full border border-border text-[10px] leading-none"
            style={{ color: "rgb(var(--muted))" }}>i</span>
        )}
      </span>
      <button type="button" onClick={acionar} disabled={carregando}
        className="rounded-full border border-border bg-card px-4 py-1.5 text-[13px] font-medium hover:bg-faint disabled:opacity-60">
        {carregando ? "Processando…" : label}
      </button>
    </div>
  )
}

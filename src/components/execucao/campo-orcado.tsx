"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { useAlteracoesNaoSalvas } from "./alteracoes-nao-salvas"
import { API_BASE } from "@/lib/api-base"
import { btn, btnPrimary } from "@/components/ui/botao"

type Estado = "idle" | "salvando" | "salvo" | "erro"
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function CampoOrcado({
  ano, mes, itemId, valorInicial,
}: { ano: number; mes: number; itemId: number; valorInicial: number | null }) {
  const { toast } = useToast()
  const router = useRouter()
  const { marcarAlterado, limparAlterado } = useAlteracoesNaoSalvas()
  const alteradoId = `orcado:${itemId}:${mes}`
  const [estado, setEstado] = useState<Estado>("idle")
  const [perguntarReplicar, setPerguntarReplicar] = useState<number | null>(null)

  async function gravar(valor: number, replicarAteFim: boolean) {
    return fetch(`${API_BASE}/execucao/orcado`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ano, mes, contaItemId: itemId, valor, replicarAteFim }),
    })
  }

  async function salvar(valor: number) {
    setEstado("salvando")
    try {
      const r = await gravar(valor, false)
      if (r.ok) {
        limparAlterado(alteradoId); setEstado("salvo"); setTimeout(() => setEstado("idle"), 2000)
        if (mes < 12) { setPerguntarReplicar(valor); return }
        router.refresh(); return
      }
      setEstado("erro")
      const corpo = await r.json().catch(() => null)
      toast({ tipo: "erro", texto: typeof corpo?.error === "string" ? corpo.error : "Falha ao gravar orçado." })
    } catch { setEstado("erro"); toast({ tipo: "erro", texto: "Sem conexão ao salvar o orçado." }) }
  }

  async function responderReplicar(replicar: boolean) {
    const valor = perguntarReplicar
    setPerguntarReplicar(null)
    if (replicar && valor != null) {
      const r = await gravar(valor, true)
      if (!r.ok) toast({ tipo: "erro", texto: "Falha ao replicar o valor pros meses seguintes." })
    }
    router.refresh()
  }

  const cor = estado === "salvo" ? "rgb(var(--pos))" : estado === "erro" ? "rgb(var(--danger))" : "rgb(var(--border))"
  return (
    <>
      <input
        className="w-24 rounded border bg-background p-1 text-right num"
        style={{ borderColor: cor }}
        type="number" step="0.01" defaultValue={valorInicial ?? undefined} placeholder="0,00"
        disabled={estado === "salvando"}
        onChange={() => marcarAlterado(alteradoId)}
        onBlur={(ev) => ev.target.value !== "" ? salvar(Number(ev.target.value)) : limparAlterado(alteradoId)}
      />
      {perguntarReplicar != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => responderReplicar(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-semibold">Replicar valor?</h2>
            <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
              Deseja replicar este valor para os meses seguintes ({MESES[mes]}–Dez)?
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => responderReplicar(false)} className={btn}>Não</button>
              <button type="button" onClick={() => responderReplicar(true)} className={btnPrimary}>Sim</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

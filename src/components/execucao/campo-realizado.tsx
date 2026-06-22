"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { useAlteracoesNaoSalvas } from "./alteracoes-nao-salvas"

type Estado = "idle" | "salvando" | "salvo" | "erro"

export function CampoRealizado({
  ano, mes, itemId, valorInicial,
}: { ano: number; mes: number; itemId: number; valorInicial: number | null }) {
  const { toast } = useToast()
  const router = useRouter()
  const { marcarAlterado, limparAlterado } = useAlteracoesNaoSalvas()
  const alteradoId = `realizado:${itemId}:${mes}`
  const [estado, setEstado] = useState<Estado>("idle")

  async function salvar(valor: number) {
    setEstado("salvando")
    try {
      const r = await fetch("/api/execucao/realizado", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano, mes, contaItemId: itemId, valor }),
      })
      if (r.ok) {
        limparAlterado(alteradoId)
        setEstado("salvo")
        router.refresh()
        setTimeout(() => setEstado("idle"), 2000)
        return
      }
      setEstado("erro")
      const corpo = await r.json().catch(() => null)
      const msg = corpo?.error
      toast({ tipo: "erro", texto: typeof msg === "string" ? msg : "Falha ao gravar realizado." })
    } catch {
      setEstado("erro")
      toast({ tipo: "erro", texto: "Sem conexão ao salvar o realizado." })
    }
  }

  const cor =
    estado === "salvo" ? "rgb(var(--pos))" :
    estado === "erro" ? "rgb(var(--danger))" : "rgb(var(--border))"
  const icone =
    estado === "salvando" ? "⟳" :
    estado === "salvo" ? "✓" :
    estado === "erro" ? "✗" : ""

  return (
    <span className="inline-flex items-center gap-1">
      <input
        className="w-28 rounded border bg-background p-1 text-right num"
        style={{ borderColor: cor }}
        type="number" step="0.01" defaultValue={valorInicial ?? undefined} placeholder="pendente"
        disabled={estado === "salvando"}
        onChange={() => marcarAlterado(alteradoId)}
        onBlur={(ev) => ev.target.value !== "" ? salvar(Number(ev.target.value)) : limparAlterado(alteradoId)}
      />
      <span className="w-3 text-xs" style={{ color: cor }} aria-hidden>{icone}</span>
    </span>
  )
}

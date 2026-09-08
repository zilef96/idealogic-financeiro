"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { useAlteracoesNaoSalvas } from "@/components/execucao/alteracoes-nao-salvas"
import { API_BASE } from "@/lib/api-base"

type Estado = "idle" | "salvando" | "salvo" | "erro"

// Atalho de valor inline na tela de Orçamento. PATCH /api/orcamento/[id] { valor }.
// O repositório interpreta `valor` conforme a periodicidade do item (mensal/anual).
export function CampoValorOrcado({ itemId, valorInicial }: { itemId: number; valorInicial: number }) {
  const { toast } = useToast()
  const router = useRouter()
  const { marcarAlterado, limparAlterado } = useAlteracoesNaoSalvas()
  const alteradoId = `valor:${itemId}`
  const [estado, setEstado] = useState<Estado>("idle")

  async function salvar(valor: number) {
    setEstado("salvando")
    try {
      const r = await fetch(`${API_BASE}/orcamento/${itemId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor }),
      })
      if (r.ok) { limparAlterado(alteradoId); setEstado("salvo"); router.refresh(); setTimeout(() => setEstado("idle"), 2000); return }
      setEstado("erro")
      const corpo = await r.json().catch(() => null)
      toast({ tipo: "erro", texto: typeof corpo?.error === "string" ? corpo.error : "Falha ao gravar valor." })
    } catch { setEstado("erro"); toast({ tipo: "erro", texto: "Sem conexão ao salvar o valor." }) }
  }

  const cor = estado === "salvo" ? "rgb(var(--pos))" : estado === "erro" ? "rgb(var(--danger))" : "rgb(var(--border))"
  return (
    <input
      className="w-24 rounded border bg-background p-1 text-right num"
      style={{ borderColor: cor }}
      type="number" step="0.01" defaultValue={valorInicial || undefined} placeholder="0,00"
      disabled={estado === "salvando"}
      onChange={() => marcarAlterado(alteradoId)}
      onBlur={(ev) => ev.target.value !== "" ? salvar(Number(ev.target.value)) : limparAlterado(alteradoId)}
    />
  )
}

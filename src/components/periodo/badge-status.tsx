"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Send, Undo2 } from "lucide-react"
import { btn, btnPrimary } from "@/components/ui/botao"

// Rótulo de estado do exercício (pertence ao título).
export function BadgeStatus({ status }: { status: "rascunho" | "publicado" }) {
  const publicado = status === "publicado"
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: publicado ? "rgb(var(--pos))" : "rgb(var(--amber))", background: publicado ? "rgb(var(--pos-soft))" : "rgb(var(--amber-soft))" }}>
      {publicado ? "Publicado" : "Rascunho"}
    </span>
  )
}

// Ação de publicar/despublicar o exercício.
export function BotaoPublicar({ ano, status }: { ano: number; status: "rascunho" | "publicado" }) {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const publicado = status === "publicado"

  async function alternar() {
    setSalvando(true)
    await fetch("/api/periodos/status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ano, acao: publicado ? "despublicar" : "publicar" }),
    })
    setSalvando(false); router.refresh()
  }

  return (
    <button type="button" onClick={alternar} disabled={salvando}
      className={publicado ? btn : btnPrimary}>
      {publicado
        ? <><Undo2 size={16} strokeWidth={2} aria-hidden /> Despublicar</>
        : <><Send size={16} strokeWidth={2} aria-hidden /> Publicar orçamento</>}
    </button>
  )
}

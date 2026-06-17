"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function BadgeStatus({ ano, status }: { ano: number; status: "rascunho" | "publicado" }) {
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
    <div className="flex items-center gap-2">
      <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ color: publicado ? "rgb(var(--pos))" : "rgb(var(--amber))", background: publicado ? "rgb(var(--pos-soft))" : "rgb(var(--amber-soft))" }}>
        {publicado ? "Publicado" : "Rascunho"}
      </span>
      <button type="button" onClick={alternar} disabled={salvando}
        className="rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium hover:bg-faint disabled:opacity-60">
        {publicado ? "Despublicar" : "Publicar orçamento"}
      </button>
    </div>
  )
}

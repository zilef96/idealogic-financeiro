"use client"
import { useState } from "react"

export function ConfirmarExclusao({ aberto, titulo, descricao, onConfirmar, onClose }: {
  aberto: boolean
  titulo: string
  descricao: string
  onConfirmar: () => Promise<string | null> // mensagem de erro, ou null no sucesso
  onClose: () => void
}) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")

  async function confirmar() {
    setErro(""); setEnviando(true)
    const msg = await onConfirmar()
    setEnviando(false)
    if (msg) { setErro(msg); return }
    onClose()
  }

  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-semibold">{titulo}</h2>
        <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>{descricao}</p>
        {erro && <p className="text-sm" style={{ color: "rgb(var(--danger))" }}>{erro}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="rounded border border-border px-3 py-1.5 text-sm hover:bg-faint">Cancelar</button>
          <button type="button" disabled={enviando} onClick={confirmar}
            className="rounded px-3 py-1.5 text-sm font-medium text-background disabled:opacity-60"
            style={{ background: "rgb(var(--danger))" }}>{enviando ? "Excluindo…" : "Excluir"}</button>
        </div>
      </div>
    </div>
  )
}

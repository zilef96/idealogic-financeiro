"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { btn, btnPrimary } from "@/components/ui/botao"
import { API_BASE } from "@/lib/api-base"

export function EditarCategoria({ grupo, aberto, onClose }: {
  grupo: { id: number; nome: string }
  aberto: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [nome, setNome] = useState(grupo.nome)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!nome.trim()) { setErro("Informe o nome da categoria."); return }
    setSalvando(true)
    const r = await fetch(`${API_BASE}/grupos/${grupo.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: nome.trim() }),
    })
    setSalvando(false)
    if (r.ok) { onClose(); router.refresh(); toast({ tipo: "sucesso", texto: "Categoria renomeada." }); return }
    if (r.status === 401 || r.status === 403) setErro("Você não tem permissão para esta ação.")
    else if (r.status === 409) setErro("Orçamento publicado; despublique para editar.")
    else setErro("Não foi possível renomear.")
  }

  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={salvar} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-semibold">Renomear categoria</h2>
        <label className="block text-sm">Nome
          <input className="mt-1 w-full rounded-[10px] border border-border bg-background p-2 text-sm" autoFocus
            value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        {erro && <p className="text-sm" style={{ color: "rgb(var(--danger))" }}>{erro}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={btn}>Cancelar</button>
          <button type="submit" disabled={salvando} className={btnPrimary}>{salvando ? "Salvando…" : "Salvar"}</button>
        </div>
      </form>
    </div>
  )
}

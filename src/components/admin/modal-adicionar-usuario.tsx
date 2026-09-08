"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { btnPrimary } from "@/components/ui/botao"
import { useToast } from "@/components/ui/toast"
import { API_BASE } from "@/lib/api-base"

const inputCls = "mt-1 w-full rounded-[10px] border border-border bg-background p-2 text-sm"

// Cria a conta (sem enviar e-mail) e devolve o link de acesso.
export function ModalAdicionarUsuario({
  onFechar,
  onCriado,
}: {
  onFechar: () => void
  onCriado: (r: { id: string; link: string }) => void
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [perfil, setPerfil] = useState("socio")
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setEnviando(true)
    const r = await fetch(`${API_BASE}/admin/convite`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, perfil }),
    })
    setEnviando(false)
    if (!r.ok) { toast({ tipo: "erro", texto: "Falha ao criar o usuário." }); return }
    const body = await r.json()
    router.refresh()
    onCriado({ id: body.id, link: body.link })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onFechar}>
      <form onSubmit={enviar} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-semibold">Adicionar usuário</h2>

        <label className="block text-sm">
          <span>Nome</span>
          <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label className="block text-sm">
          <span>E-mail</span>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block text-sm">
          <span>Perfil</span>
          <select className={inputCls} value={perfil} onChange={(e) => setPerfil(e.target.value)}>
            <option value="socio">Sócio (visualizador)</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button type="button" onClick={onFechar}
            className="text-[13px] font-medium" style={{ color: "rgb(var(--muted))" }}>
            Cancelar
          </button>
          <button type="submit" disabled={enviando} className={btnPrimary}>
            {enviando ? "Criando…" : "Criar e gerar link"}
          </button>
        </div>
      </form>
    </div>
  )
}

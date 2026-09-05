"use client"
import { useState } from "react"
import { btn, btnPrimary } from "@/components/ui/botao"
import { useToast } from "@/components/ui/toast"

// Diálogo com o link de acesso gerado: copiar e gerar novamente.
// O link do Supabase expira (~24h), por isso a ação de regenerar.
export function ModalLink({
  id,
  linkInicial,
  onFechar,
}: {
  id: string
  linkInicial: string
  onFechar: () => void
}) {
  const { toast } = useToast()
  const [link, setLink] = useState(linkInicial)
  const [gerando, setGerando] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(link)
    toast({ tipo: "sucesso", texto: "Link copiado." })
  }

  async function gerarNovamente() {
    setGerando(true)
    const r = await fetch(`/api/admin/usuarios/${id}/link`, { method: "POST" })
    setGerando(false)
    if (!r.ok) { toast({ tipo: "erro", texto: "Falha ao gerar o link." }); return }
    const body = await r.json()
    setLink(body.link)
    toast({ tipo: "sucesso", texto: "Novo link gerado." })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onFechar}>
      <div role="dialog" aria-modal="true" aria-label="Link de acesso"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-semibold">Link de acesso</h2>
        <p className="text-[13px]" style={{ color: "rgb(var(--muted))" }}>
          Envie este link para a pessoa (WhatsApp, e-mail interno). Ela define a
          senha e entra. O link expira em ~24h — se expirar, gere um novo.
        </p>

        <div className="flex gap-2">
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-[10px] border border-border bg-background p-2 font-mono text-[12px]" />
          <button type="button" onClick={copiar} className={`${btnPrimary} shrink-0`}>Copiar</button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button type="button" onClick={gerarNovamente} disabled={gerando} className={btn}>
            {gerando ? "Gerando…" : "Gerar novamente"}
          </button>
          <button type="button" onClick={onFechar}
            className="text-[13px] font-medium" style={{ color: "rgb(var(--muted))" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

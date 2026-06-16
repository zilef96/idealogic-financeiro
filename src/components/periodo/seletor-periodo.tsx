"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SeletorPeriodo({ ano, anos }: { ano: number; anos: number[] }) {
  const router = useRouter()
  const [criando, setCriando] = useState(false)
  const [novoAno, setNovoAno] = useState(ano + 1)
  const [copiar, setCopiar] = useState(true)

  async function criar() {
    await fetch("/api/periodos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ano: novoAno, copiarDe: copiar ? ano : null }),
    })
    setCriando(false); router.push(`/orcamento?ano=${novoAno}`); router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <select className="rounded border border-border bg-background p-1.5" value={ano}
        onChange={(e) => router.push(`/orcamento?ano=${e.target.value}`)}>
        {anos.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
      <button className="rounded border border-border px-2 py-1.5 text-sm" onClick={() => setCriando(true)}>
        + Novo período
      </button>
      {criando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCriando(false)}>
          <div className="w-80 space-y-3 rounded-lg border border-border bg-background p-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold">Novo período</h2>
            <label className="block text-sm">Ano
              <input type="number" className="mt-1 w-full rounded border border-border bg-background p-1.5"
                value={novoAno} onChange={(e) => setNovoAno(Number(e.target.value))} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={copiar} onChange={(e) => setCopiar(e.target.checked)} />
              Copiar do ano {ano} (desmarque para começar do zero)
            </label>
            <div className="flex justify-end gap-2">
              <button className="rounded border border-border px-3 py-1.5 text-sm" onClick={() => setCriando(false)}>Cancelar</button>
              <button className="rounded bg-foreground px-3 py-1.5 text-sm text-background" onClick={criar}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

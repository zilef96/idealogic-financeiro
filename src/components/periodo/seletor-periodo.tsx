"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SeletorPeriodo({ ano, anos }: { ano: number; anos: number[] }) {
  const router = useRouter()
  const [criando, setCriando] = useState(false)
  const [novoAno, setNovoAno] = useState(ano + 1)
  const [doZero, setDoZero] = useState(false)
  const [origem, setOrigem] = useState(ano)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function abrir() {
    setNovoAno(ano + 1); setDoZero(false); setOrigem(ano); setErro(null); setCriando(true)
  }

  async function criar() {
    setErro(null); setEnviando(true)
    try {
      const res = await fetch("/api/periodos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano: novoAno, copiarDe: doZero ? null : origem }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setErro(typeof body?.error === "string" ? body.error : "Falha ao criar período.")
        return
      }
      setCriando(false)
      router.push(`/orcamento?ano=${novoAno}`); router.refresh()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select className="rounded border border-border bg-background p-1.5" value={ano}
        onChange={(e) => router.push(`/orcamento?ano=${e.target.value}`)}>
        {anos.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
      <button className="rounded border border-border px-2 py-1.5 text-sm" onClick={abrir}>
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
            <fieldset className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="origem" checked={!doZero} onChange={() => setDoZero(false)} />
                Copiar de
                <select className="rounded border border-border bg-background p-1" disabled={doZero}
                  value={origem} onChange={(e) => setOrigem(Number(e.target.value))}>
                  {anos.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="origem" checked={doZero} onChange={() => setDoZero(true)} />
                Começar do zero (só os blocos R/C/D/E)
              </label>
            </fieldset>
            {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
            <div className="flex justify-end gap-2">
              <button className="rounded border border-border px-3 py-1.5 text-sm" onClick={() => setCriando(false)}>Cancelar</button>
              <button className="rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
                disabled={enviando} onClick={criar}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

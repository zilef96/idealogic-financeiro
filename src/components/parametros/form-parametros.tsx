"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { PARAMETROS_EXERCICIO, type ChaveParametro, type FormatoParametro } from "@/lib/services/parametros-service"
import { useToast } from "@/components/ui/toast"

const fmt = (v: number, f: FormatoParametro) =>
  f === "percent" ? (v * 100).toString() : v.toString()
const parse = (s: string, f: FormatoParametro) =>
  f === "percent" ? Number(s) / 100 : Number(s)
const sufixo = (f: FormatoParametro) => (f === "percent" ? "%" : f === "moeda" ? "R$" : "")

export function FormParametros({ ano, valores }: { ano: number; valores: Record<ChaveParametro, number> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [salvando, setSalvando] = useState<ChaveParametro | null>(null)

  async function salvar(chave: ChaveParametro, formato: FormatoParametro, texto: string) {
    setSalvando(chave)
    const r = await fetch("/api/parametros", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ano, chave, valor: parse(texto, formato) }),
    })
    setSalvando(null)
    if (r.ok) { toast({ tipo: "sucesso", texto: "Parâmetro salvo." }); router.refresh() }
    else toast({ tipo: "erro", texto: "Falha ao salvar parâmetro." })
  }

  return (
    <div className="space-y-2">
      {PARAMETROS_EXERCICIO.map((p) => (
        <div key={p.chave} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <label className="text-sm" htmlFor={p.chave}>{p.rotulo}</label>
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: "rgb(var(--muted))" }}>{sufixo(p.formato)}</span>
            <input id={p.chave} type="number" step="0.0001"
              defaultValue={fmt(valores[p.chave], p.formato)}
              disabled={salvando === p.chave}
              onBlur={(e) => e.target.value !== "" && salvar(p.chave, p.formato, e.target.value)}
              className="w-36 rounded border border-border bg-background p-1.5 text-right num" />
          </div>
        </div>
      ))}
    </div>
  )
}

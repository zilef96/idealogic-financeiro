"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { SaldosBancarios } from "@/lib/services/relatorio-service"
import { fmtValor } from "@/components/dashboard/formatos"

const CONTAS: { chave: keyof Omit<SaldosBancarios, "saldoGeral">; rotulo: string }[] = [
  { chave: "sicrediCc", rotulo: "Sicredi — Conta corrente" },
  { chave: "sicrediAplicacao", rotulo: "Sicredi — Aplicação" },
  { chave: "banrisulCc", rotulo: "Banrisul — Conta corrente" },
]

export function SaldosCard({ saldos, ano, mes, podeEditar }: { saldos: SaldosBancarios; ano: number; mes: number; podeEditar: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState({ sicrediCc: saldos.sicrediCc, sicrediAplicacao: saldos.sicrediAplicacao, banrisulCc: saldos.banrisulCc })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const geral = form.sicrediCc + form.sicrediAplicacao + form.banrisulCc

  async function salvar() {
    setSalvando(true); setErro(null)
    try {
      const res = await fetch("/api/relatorio/saldos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ano, mes,
          saldoSicrediCc: form.sicrediCc,
          saldoSicrediAplicacao: form.sicrediAplicacao,
          saldoBanrisulCc: form.banrisulCc,
        }),
      })
      if (!res.ok) throw new Error("Falha ao salvar")
      router.refresh()
    } catch {
      setErro("Não foi possível salvar os saldos.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>Contas da Idealogic</h3>
      <p className="num mt-1 text-2xl font-semibold">{fmtValor(podeEditar ? geral : saldos.saldoGeral, "moeda")}</p>
      <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>Saldo geral</p>

      <div className="mt-3 space-y-2">
        {CONTAS.map((conta) => (
          <div key={conta.chave} className="flex items-center justify-between gap-2 text-sm">
            <span>{conta.rotulo}</span>
            {podeEditar ? (
              <input
                type="number" min={0} step="0.01"
                className="num w-36 rounded-lg border border-border bg-background px-2 py-1 text-right"
                value={form[conta.chave]}
                onChange={(e) => setForm((f) => ({ ...f, [conta.chave]: Number(e.target.value) || 0 }))}
              />
            ) : (
              <span className="num">{fmtValor(saldos[conta.chave], "moeda")}</span>
            )}
          </div>
        ))}
      </div>

      {podeEditar && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button" onClick={salvar} disabled={salvando}
            className="btn rounded-lg border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-60"
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
          {erro && <span className="text-xs" style={{ color: "#dc2626" }}>{erro}</span>}
        </div>
      )}
    </div>
  )
}

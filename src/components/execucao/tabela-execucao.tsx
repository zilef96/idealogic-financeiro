"use client"
import { useState } from "react"
import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"

const fmt = (n: number | null) => (n == null ? "pendente" : n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function TabelaExecucao({
  ano, linhas, meses, editavel,
}: { ano: number; linhas: LinhaExecucao[]; meses: number[]; editavel: boolean }) {
  const [salvando, setSalvando] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string>("")

  async function salvarRealizado(itemId: number, mes: number, valor: number) {
    setSalvando(`${itemId}-${mes}`); setAviso("")
    const r = await fetch("/api/execucao/realizado", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ano, mes, contaItemId: itemId, valor }),
    })
    setSalvando(null)
    if (r.status === 409) setAviso("Competência fechada; reabra o mês para editar.")
    else if (!r.ok) setAviso("Falha ao gravar realizado.")
  }

  const itens = linhas.filter((l) => !l.isGrupo && l.itemId !== null)
  const ids = Array.from(new Set(itens.map((l) => l.itemId as number)))

  return (
    <div className="space-y-2">
      {aviso && <p className="text-sm" style={{ color: "rgb(var(--danger))" }}>{aviso}</p>}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: "rgb(var(--muted))" }}>
              <th className="sticky left-0 bg-card px-3 py-2 text-left font-medium">Item</th>
              {meses.map((m) => (
                <th key={m} colSpan={3} className="border-l border-border px-2 py-2 text-center font-medium">{MESES[m - 1]}</th>
              ))}
            </tr>
            <tr className="text-[11px]" style={{ color: "rgb(var(--muted))" }}>
              <th className="sticky left-0 bg-card px-3 pb-2 text-left font-normal">&nbsp;</th>
              {meses.map((m) => (
                <th key={m} colSpan={3} className="border-l border-border px-2 pb-2 text-center font-normal">
                  Projetado · Mensal · Realizado
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ids.map((id) => {
              const doItem = itens.filter((l) => l.itemId === id)
              const nome = doItem[0]?.nome ?? String(id)
              return (
                <tr key={id} className="border-t border-border hover:bg-faint">
                  <td className="sticky left-0 bg-card px-3 py-1.5 whitespace-nowrap">{nome}</td>
                  {meses.map((m) => {
                    const c = doItem.find((l) => l.mes === m)
                    if (!c) return <td key={m} colSpan={3} className="border-l border-border" />
                    const negativo = c.realizado != null && c.desvio < 0
                    return (
                      <td key={m} colSpan={3} className="num whitespace-nowrap border-l border-border px-2 py-1.5 text-right">
                        <span style={{ color: "rgb(var(--muted))" }}>{fmt(c.orcadoProjetado)}</span>
                        <span style={{ color: "rgb(var(--muted))" }}> · </span>
                        <span>{fmt(c.orcado)}</span>
                        <span style={{ color: "rgb(var(--muted))" }}> · </span>
                        {editavel ? (
                          <input
                            className="w-24 rounded border border-border bg-background p-0.5 text-right"
                            type="number" step="0.01" defaultValue={c.realizado ?? undefined} placeholder="pendente"
                            disabled={salvando === `${id}-${m}`}
                            onBlur={(e) => e.target.value !== "" && salvarRealizado(id, m, Number(e.target.value))}
                          />
                        ) : (
                          <span style={negativo ? { color: "rgb(var(--danger))" } : undefined}>{fmt(c.realizado)}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

"use client"
import { Fragment, useState } from "react"
import { formatarIndicador, type Indicador } from "@/lib/services/execucao-service"

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

// orcado[mes][i] e realizado[mes][i] — mesma ordem de indicadores em todos os meses.
export function TabelaIndicadores({ orcado, realizado }: { orcado: Indicador[][]; realizado: Indicador[][] }) {
  const [aberto, setAberto] = useState(false)
  const modelo = realizado[0] ?? []
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button type="button" onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left" style={{ background: "rgb(var(--faint))" }}>
        <svg className="h-4 w-4 shrink-0 transition-transform duration-200" style={{ color: "rgb(var(--muted))", transform: aberto ? "rotate(90deg)" : "none" }}
          fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-display text-[15px] font-semibold">Indicadores</span>
        <span className="num text-[11px]" style={{ color: "rgb(var(--muted))" }}>orçado · realizado por mês</span>
      </button>
      {aberto && (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "rgb(var(--muted))" }}>
                <th rowSpan={2} className="sticky left-0 z-10 bg-card px-3 py-2 text-left align-bottom text-[11px] font-semibold uppercase tracking-wider">Indicador</th>
                {MESES.map((m) => (
                  <th key={m} colSpan={2} className="border-l border-border px-2 py-1.5 text-center text-[11px] font-semibold">{m}</th>
                ))}
              </tr>
              <tr className="text-[10px]" style={{ color: "rgb(var(--muted))" }}>
                {MESES.map((m) => (
                  <Fragment key={m}>
                    <th className="border-l border-border px-2 pb-1.5 text-right font-medium">Orçado</th>
                    <th className="px-2 pb-1.5 text-right font-medium">Realiz.</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {modelo.map((ind, i) => (
                <tr key={ind.rotulo} className="border-t border-border hover:bg-faint">
                  <td className="sticky left-0 z-10 bg-card px-3 py-1.5 whitespace-nowrap">{ind.rotulo}</td>
                  {MESES.map((_, mi) => {
                    const o = orcado[mi]?.[i]
                    const r = realizado[mi]?.[i]
                    const rNeg = !!r && r.formato === "moeda" && !r.pendente && r.valor != null && r.valor < 0
                    return (
                      <Fragment key={mi}>
                        <td className="num border-l border-border px-2 py-1.5 text-right whitespace-nowrap" style={{ color: "rgb(var(--muted))" }}>
                          {o ? formatarIndicador(o) : "—"}
                        </td>
                        <td className="num px-2 py-1.5 text-right whitespace-nowrap"
                          style={rNeg ? { color: "rgb(var(--danger))" } : r?.pendente ? { color: "rgb(var(--muted) / 0.6)" } : undefined}>
                          {r ? formatarIndicador(r) : "—"}
                        </td>
                      </Fragment>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

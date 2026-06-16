"use client"
import { useState } from "react"
import { formatarIndicador, type Indicador } from "@/lib/services/execucao-service"

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

// indicadoresPorMes[mes][i] — mesma ordem de indicadores em todos os meses.
export function TabelaIndicadores({ indicadoresPorMes }: { indicadoresPorMes: Indicador[][] }) {
  const [aberto, setAberto] = useState(true)
  const modelo = indicadoresPorMes[0] ?? []
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button type="button" onClick={() => setAberto((v) => !v)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <svg className="h-3.5 w-3.5 shrink-0 transition-transform duration-200" style={{ color: "rgb(var(--muted))", transform: aberto ? "rotate(90deg)" : "none" }}
          fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-display text-[14px] font-semibold">Indicadores</span>
      </button>
      {aberto && (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "rgb(var(--muted))" }}>
                <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">Indicador</th>
                {MESES.map((m) => (
                  <th key={m} className="num border-l border-border px-2 py-2 text-right text-[11px] font-semibold">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modelo.map((ind, i) => (
                <tr key={ind.rotulo} className="border-t border-border hover:bg-faint">
                  <td className="sticky left-0 z-10 bg-card px-3 py-1.5 whitespace-nowrap">{ind.rotulo}</td>
                  {indicadoresPorMes.map((mesArr, mi) => {
                    const cel = mesArr[i]
                    const negativo = cel.formato === "moeda" && !cel.pendente && cel.valor != null && cel.valor < 0
                    return (
                      <td key={mi} className="num border-l border-border px-2 py-1.5 text-right whitespace-nowrap"
                        style={negativo ? { color: "rgb(var(--danger))" } : cel.pendente ? { color: "rgb(var(--muted) / 0.6)" } : undefined}>
                        {formatarIndicador(cel)}
                      </td>
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

import type { Kpi } from "@/lib/services/dashboard-service"
import { fmtValor, fmtDelta, corDelta } from "./formatos"

export function KpiHeader({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((k) => (
        <div key={k.id} className="rounded-xl border border-border bg-card p-3">
          <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>{k.rotulo}</div>
          <div className="num font-display mt-1 text-lg font-semibold"
            style={k.pendente ? { color: "rgb(var(--muted) / 0.6)" } : undefined}>{fmtValor(k.valor, k.formato)}</div>
          <div className="mt-1 flex flex-wrap gap-x-2 text-[11px]">
            {k.deltas.map((d) => (
              <span key={d.rotulo} style={{ color: corDelta(d.valor, d.inverted) }}>
                {fmtDelta(d.valor, d.formato)} <span style={{ color: "rgb(var(--muted))" }}>{d.rotulo}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

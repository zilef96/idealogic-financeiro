import { formatarIndicador as fmt, type Indicador } from "@/lib/services/execucao-service"

export function CardsIndicadores({ indicadores }: { indicadores: Indicador[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {indicadores.map((i) => (
        <div key={i.rotulo} className="rounded-xl border border-border bg-card p-3">
          <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>{i.rotulo}</div>
          <div className="num font-display mt-1 text-lg font-semibold"
            style={i.pendente ? { color: "rgb(var(--muted) / 0.6)" } : undefined}>{fmt(i)}</div>
        </div>
      ))}
    </div>
  )
}

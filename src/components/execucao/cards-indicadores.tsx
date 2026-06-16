const fmt = (n: number | null, pct = false) =>
  n == null ? "—" : pct ? `${n.toFixed(1)}%` : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function CardsIndicadores({ indicadores }: {
  indicadores: { rotulo: string; valor: number | null; pct?: boolean }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {indicadores.map((i) => (
        <div key={i.rotulo} className="rounded-xl border border-border bg-card p-3">
          <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>{i.rotulo}</div>
          <div className="num font-display mt-1 text-lg font-semibold">{fmt(i.valor, i.pct)}</div>
        </div>
      ))}
    </div>
  )
}

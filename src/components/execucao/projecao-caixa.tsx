const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function ProjecaoCaixa({ saldos }: { saldos: number[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-display text-[14px] font-semibold">Projeção de caixa</h3>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: "rgb(var(--muted))" }}>
              {MESES.map((m) => (
                <th key={m} className="num border-l border-border px-2 py-2 text-right text-[11px] font-semibold first:border-l-0">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {saldos.map((s, i) => (
                <td key={i} className="num border-l border-border px-2 py-2 text-right first:border-l-0"
                  style={s < 0 ? { color: "rgb(var(--danger))", fontWeight: 600 } : undefined}>{brl(s)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

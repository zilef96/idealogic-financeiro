"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts"
import type { RelatorioPayload } from "@/lib/services/relatorio-service"
import { NOMES_MES, fmtMoedaTip } from "@/components/dashboard/formatos"
import { useChartTheme } from "@/components/dashboard/use-chart-theme"

// 5 séries do deck, com a paleta do deck para reconhecimento imediato.
const SERIES = [
  { chave: "receitas", nome: "Receitas", cor: "#84cc16" },
  { chave: "cotas", nome: "Cota Sócios", cor: "#14b8a6" },
  { chave: "tributos", nome: "Tributos", cor: "#e879f9" },
  { chave: "custos", nome: "Custos", cor: "#ef4444" },
  { chave: "despesas", nome: "Despesas", cor: "#3b82f6" },
] as const

// Gráfico de linhas do fluxo mensal. `fluxo.grafico` já traz null após a
// competência de referência, então as linhas param sozinhas (sem a cauda zerada).
export function FluxoLinhas({ fluxo }: { fluxo: RelatorioPayload["fluxo"] }) {
  const ct = useChartTheme()
  const data = fluxo.grafico.map((p) => ({ ...p, mes: NOMES_MES[p.mes - 1] }))
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>
        Evolução mensal das séries
      </h3>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: ct.axis }} />
          <YAxis tick={{ fontSize: 12, fill: ct.axis }} />
          <Tooltip formatter={(v) => fmtMoedaTip(v)} />
          <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12 }} />
          {SERIES.map((s) => (
            <Line
              key={s.chave} type="monotone" dataKey={s.chave} name={s.nome}
              stroke={s.cor} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

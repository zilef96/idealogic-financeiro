"use client"
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts"
import type { ClientePareto } from "@/lib/services/dashboard-service"
import { fmtMoedaTip, fmtPctTip } from "../formatos"

// Traduz a participação do maior cliente em nível de risco de dependência.
function risco(pct: number): { rotulo: string; cor: string } {
  if (pct >= 40) return { rotulo: "risco crítico", cor: "#dc2626" }
  if (pct >= 25) return { rotulo: "risco alto", cor: "#d97706" }
  if (pct >= 15) return { rotulo: "risco médio", cor: "#ca8a04" }
  return { rotulo: "risco baixo", cor: "#16a34a" }
}

export function ConcentracaoClientesChart({ dados }: { dados: ClientePareto[] }) {
  const data = dados.map((c) => ({ nome: c.nome, receita: c.receita, acumulado: c.acumulado }))
  const principal = dados[0]
  const r = principal ? risco(principal.percentual) : null
  return (
    <div>
      <h3 className="text-sm font-semibold">Concentração por Cliente (Pareto)</h3>
      {principal && r && (
        <p className="mt-0.5 text-xs">
          <span style={{ color: "rgb(var(--muted))" }}>Cliente principal: </span>
          <strong>{principal.nome}</strong>
          <span style={{ color: "rgb(var(--muted))" }}> — {principal.percentual.toFixed(0)}% da receita · </span>
          <span style={{ color: r.cor, fontWeight: 600 }}>{r.rotulo}</span>
        </p>
      )}
      <p className="mb-2 text-xs" style={{ color: "rgb(var(--muted))" }}>Quanto cada cliente representa da receita. A linha soma o acumulado: se poucos clientes passam de 80%, há risco de dependência.</p>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis dataKey="nome" angle={-40} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11 }} />
          <YAxis yAxisId="r" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="p" orientation="right" unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
          <ReferenceLine yAxisId="p" y={80} stroke="#d97706" strokeDasharray="4 4" />
          <Tooltip formatter={(v, n) => n === "acumulado" ? fmtPctTip(v) : fmtMoedaTip(v)} />
          <Bar yAxisId="r" dataKey="receita" name="Receita" fill="#2563eb" />
          <Line yAxisId="p" dataKey="acumulado" name="% acumulado" stroke="#d97706" dot connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

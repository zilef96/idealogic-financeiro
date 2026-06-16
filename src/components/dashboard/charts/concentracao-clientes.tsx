"use client"
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts"
import type { ClientePareto } from "@/lib/services/dashboard-service"
import { fmtMoedaTip, fmtPctTip } from "../formatos"

export function ConcentracaoClientesChart({ dados }: { dados: ClientePareto[] }) {
  const data = dados.map((c) => ({ nome: c.nome, receita: c.receita, acumulado: c.acumulado }))
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">Concentração por Cliente (Pareto)</h3>
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

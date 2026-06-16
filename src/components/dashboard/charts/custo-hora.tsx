"use client"
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import type { PontoCustoHora } from "@/lib/services/dashboard-service"
import { NOMES_MES } from "../formatos"

export function CustoHoraChart({ dados }: { dados: PontoCustoHora[] }) {
  const data = dados.map((p) => ({ mes: NOMES_MES[p.mes - 1], custoHora: p.custoHora, horas: p.horas }))
  return (
    <div>
      <h3 className="text-sm font-semibold">Custo Hora Idealogic</h3>
      <p className="mb-2 text-xs" style={{ color: "rgb(var(--muted))" }}>Quanto custa cada hora de trabalho da empresa. A barra ao fundo são as horas faturáveis do mês.</p>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="r" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="h" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v, n) => n === "horas" ? `${(Number(v) || 0).toLocaleString("pt-BR")} h` : (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
          <Bar yAxisId="h" dataKey="horas" name="Horas" fill="#64748b" fillOpacity={0.2} />
          <Line yAxisId="r" dataKey="custoHora" name="Custo/hora" stroke="#2563eb" dot connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

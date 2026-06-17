"use client"
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"
import type { PontoCustoHora } from "@/lib/services/dashboard-service"
import { NOMES_MES } from "../formatos"
import { ChartTitulo, legendaFormatter, tooltipColorido } from "../chart-ui"
import { C } from "../cores"
import { useChartTheme } from "../use-chart-theme"

export function CustoHoraChart({ dados }: { dados: PontoCustoHora[] }) {
  const ct = useChartTheme()
  const data = dados.map((p) => ({ mes: NOMES_MES[p.mes - 1], custoHora: p.custoHora, horas: p.horas }))
  return (
    <div>
      <ChartTitulo titulo="Custo Hora Idealogic" info="Quanto custa cada hora de trabalho da empresa (custos operacionais e administrativos divididos pelas horas faturáveis). A barra ao fundo são as horas faturáveis do mês." />
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: ct.axis }} />
          <YAxis yAxisId="r" tick={{ fontSize: 12, fill: ct.axis }} />
          <YAxis yAxisId="h" orientation="right" tick={{ fontSize: 12, fill: ct.axis }} />
          <Tooltip content={tooltipColorido(ct, (v, n) => n === "Horas" ? `${(Number(v) || 0).toLocaleString("pt-BR")} h` : (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))} />
          <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} formatter={legendaFormatter(ct.axis)} />
          <Bar yAxisId="h" dataKey="horas" name="Horas" fill={C.orcado} fillOpacity={0.25} />
          <Line yAxisId="r" dataKey="custoHora" name="Custo/hora" stroke={C.realizado} dot connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

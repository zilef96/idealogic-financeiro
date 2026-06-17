"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"
import type { PontoMargem } from "@/lib/services/dashboard-service"
import { NOMES_MES, fmtPctTip } from "../formatos"
import { ChartTitulo, legendaFormatter } from "../chart-ui"
import { C } from "../cores"
import { useChartTheme, tooltipEstilo } from "../use-chart-theme"

export function MargemChart({ dados }: { dados: PontoMargem[] }) {
  const ct = useChartTheme()
  const data = dados.map((p) => ({ mes: NOMES_MES[p.mes - 1], margem: p.margem }))
  return (
    <div>
      <ChartTitulo titulo="Margem de Contribuição (%)" info="De cada R$ faturado em serviços, quanto sobra como resultado, mês a mês. Quanto mais alta e estável a linha, mais saudável o negócio." />
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: ct.axis }} />
          <YAxis unit="%" tick={{ fontSize: 12, fill: ct.axis }} />
          <Tooltip {...tooltipEstilo(ct)} formatter={(v) => fmtPctTip(v)} />
          <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} formatter={legendaFormatter(ct.axis)} />
          <Line dataKey="margem" name="Margem" stroke={C.margem} dot connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

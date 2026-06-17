"use client"
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, CartesianGrid, Legend } from "recharts"
import type { PontoOrcadoRealizado } from "@/lib/services/dashboard-service"
import { NOMES_MES, fmtMoedaTip, fmtPctTip } from "../formatos"
import { ChartTitulo, legendaFormatter } from "../chart-ui"
import { C } from "../cores"
import { useChartTheme, tooltipEstilo } from "../use-chart-theme"

export function OrcadoRealizadoChart({ dados }: { dados: PontoOrcadoRealizado[] }) {
  const ct = useChartTheme()
  const data = dados.map((p) => ({ mes: NOMES_MES[p.mes - 1], orcado: p.orcado, realizado: p.realizado, desvio: p.desvioPercentual }))
  return (
    <div>
      <ChartTitulo titulo="Orçado × Realizado" info="Compara o faturamento de serviços planejado (orçado, barra clara) com o que de fato entrou (realizado, barra forte), mês a mês. A linha mostra o desvio em %; a faixa verde é a tolerância de ±5%." />
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: ct.axis }} />
          <YAxis yAxisId="r" tick={{ fontSize: 12, fill: ct.axis }} />
          <YAxis yAxisId="p" orientation="right" unit="%" tick={{ fontSize: 12, fill: ct.axis }} />
          <ReferenceArea yAxisId="p" y1={-5} y2={5} fill={C.pos} fillOpacity={0.06} />
          <Tooltip {...tooltipEstilo(ct)} formatter={(v, n) => n === "Desvio %" ? fmtPctTip(v) : fmtMoedaTip(v)} />
          <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} formatter={legendaFormatter(ct.axis)} />
          <Bar yAxisId="r" dataKey="orcado" name="Orçado" fill={C.orcado} fillOpacity={0.55} />
          <Bar yAxisId="r" dataKey="realizado" name="Realizado" fill={C.realizado} />
          <Line yAxisId="p" dataKey="desvio" name="Desvio %" stroke={C.ambar} dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

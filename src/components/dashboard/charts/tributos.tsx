"use client"
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts"
import type { PontoTributo } from "@/lib/services/dashboard-service"
import { NOMES_MES, fmtMoedaTip, fmtPctTip } from "../formatos"
import { ChartTitulo, legendaFormatter } from "../chart-ui"
import { C } from "../cores"
import { useChartTheme, tooltipEstilo } from "../use-chart-theme"

export function TributosChart({ dados }: { dados: PontoTributo[] }) {
  const ct = useChartTheme()
  const data = dados.map((p) => ({ mes: NOMES_MES[p.mes - 1], pis: p.pis, cofins: p.cofins, issqn: p.issqn, carga: p.cargaPercentual }))
  return (
    <div>
      <ChartTitulo titulo="Carga Tributária" info="Impostos sobre o faturamento por mês, empilhados por tipo (PIS, COFINS, ISSQN). A linha é o peso total em % sobre o faturamento de serviços. CSLL e IRPJ ainda não entram (sem alíquota cadastrada)." />
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: ct.axis }} />
          <YAxis yAxisId="r" tick={{ fontSize: 12, fill: ct.axis }} />
          <YAxis yAxisId="p" orientation="right" unit="%" tick={{ fontSize: 12, fill: ct.axis }} />
          <Tooltip {...tooltipEstilo(ct)} formatter={(v, n) => n === "Carga %" ? fmtPctTip(v) : fmtMoedaTip(v)} />
          <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} formatter={legendaFormatter(ct.axis)} />
          <Bar yAxisId="r" dataKey="pis" name="PIS" stackId="t" fill={ct.tributos[0]} />
          <Bar yAxisId="r" dataKey="cofins" name="COFINS" stackId="t" fill={ct.tributos[1]} />
          <Bar yAxisId="r" dataKey="issqn" name="ISSQN" stackId="t" fill={ct.tributos[2]} />
          <Line yAxisId="p" dataKey="carga" name="Carga %" stroke={C.neg} dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

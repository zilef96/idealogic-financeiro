"use client"
import { ComposedChart, Bar, Line, Cell, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Legend } from "recharts"
import type { PontoSuperavit } from "@/lib/services/dashboard-service"
import { NOMES_MES, fmtMoedaTip } from "../formatos"
import { ChartTitulo, legendaFormatter, tooltipColorido } from "../chart-ui"
import { C } from "../cores"
import { useChartTheme } from "../use-chart-theme"

// Rótulo com sinal explícito (+/−): reforça superávit×déficit sem depender só da cor (WCAG).
function rotuloSinal(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n) || n === 0) return ""
  const milhares = Math.round(Math.abs(n) / 1000)
  return `${n > 0 ? "+" : "−"}${milhares}k`
}

export function SuperavitChart({ dados }: { dados: PontoSuperavit[] }) {
  const ct = useChartTheme()
  const data = dados.map((p) => ({ mes: NOMES_MES[p.mes - 1], superavit: p.superavit, acumulado: p.acumulado }))
  return (
    <div>
      <ChartTitulo titulo="Superávit / Déficit mensal" info="Resultado de cada mês: barra para cima e com + = sobrou dinheiro (superávit); para baixo e com − = faltou (déficit). A linha índigo é o resultado acumulado no ano." />
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: ct.axis }} />
          <YAxis tick={{ fontSize: 12, fill: ct.axis }} />
          <ReferenceLine y={0} stroke={ct.refLine} strokeWidth={1.5} />
          <Tooltip content={tooltipColorido(ct, (v) => fmtMoedaTip(v),
            (e) => e.name === "Superávit/Déficit" ? ((Number(e.value) || 0) >= 0 ? C.pos : C.neg) : e.color)} />
          <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} formatter={legendaFormatter(ct.axis)} />
          <Bar dataKey="superavit" name="Superávit/Déficit" fill={C.pos}>
            {data.map((d, i) => <Cell key={i} fill={(d.superavit ?? 0) >= 0 ? C.pos : C.neg} />)}
            <LabelList dataKey="superavit" position="top" fontSize={10} fill={ct.label} formatter={rotuloSinal} />
          </Bar>
          <Line dataKey="acumulado" name="Acumulado" stroke={C.acumulado} dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

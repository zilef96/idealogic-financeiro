"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts"
import { fmtMoedaTip } from "../formatos"
import { ChartTitulo } from "../chart-ui"
import { C } from "../cores"
import { useChartTheme, tooltipEstilo } from "../use-chart-theme"

function rotuloMil(v: unknown): string {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n / 1000)}k` : ""
}

export function TopDespesasChart({ dados }: { dados: { nome: string; valor: number }[] }) {
  const ct = useChartTheme()
  return (
    <div>
      <ChartTitulo titulo="Top 5 Despesas" info="As cinco maiores despesas acumuladas no ano — onde mais sai dinheiro. O valor na ponta de cada barra está em milhares de reais." />
      <ResponsiveContainer width="100%" height={Math.max(160, dados.length * 44)}>
        <BarChart data={dados} layout="vertical" margin={{ left: 16, right: 28 }}>
          <XAxis type="number" tick={{ fontSize: 12, fill: ct.axis }} hide />
          <YAxis type="category" dataKey="nome" width={160} tick={{ fontSize: 12, fill: ct.axis }} />
          <Tooltip {...tooltipEstilo(ct)} formatter={(v) => fmtMoedaTip(v)} />
          <Bar dataKey="valor" name="Despesa" fill={C.neg}>
            <LabelList dataKey="valor" position="right" fontSize={10} fill={ct.label} formatter={rotuloMil} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

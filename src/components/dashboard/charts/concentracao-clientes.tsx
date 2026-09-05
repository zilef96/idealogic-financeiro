"use client"
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Legend } from "recharts"
import type { ClientePareto } from "@/lib/services/dashboard-service"
import { fmtMoedaTip, fmtPctTip } from "../formatos"
import { ChartTitulo, legendaFormatter, tooltipColorido } from "../chart-ui"
import { C } from "../cores"
import { useChartTheme } from "../use-chart-theme"

// Traduz a participação do maior cliente em nível de risco de dependência.
function risco(pct: number): { rotulo: string; cor: string } {
  if (pct >= 40) return { rotulo: "risco crítico", cor: "#c23b32" }
  if (pct >= 25) return { rotulo: "risco alto", cor: "#b9790e" }
  if (pct >= 15) return { rotulo: "risco médio", cor: "#ca8a04" }
  return { rotulo: "risco baixo", cor: "#128a67" }
}

export function ConcentracaoClientesChart({ dados }: { dados: ClientePareto[] }) {
  const ct = useChartTheme()
  const data = dados.map((c) => ({ nome: c.nome, receita: c.receita, acumulado: c.acumulado }))
  const principal = dados[0]
  const r = principal ? risco(principal.percentual) : null
  return (
    <div>
      <ChartTitulo titulo="Concentração por Cliente (Pareto)" info="Quanto cada cliente representa da receita, do maior para o menor. A linha soma o acumulado: se poucos clientes ultrapassam a marca de 80%, há risco de dependência comercial." />
      {principal && r && (
        <p className="-mt-1 mb-2 text-xs">
          <span style={{ color: "rgb(var(--muted))" }}>Cliente principal: </span>
          <strong>{principal.nome}</strong>
          <span style={{ color: "rgb(var(--muted))" }}> — {principal.percentual.toFixed(0)}% da receita · </span>
          <span style={{ color: r.cor, fontWeight: 600 }}>{r.rotulo}</span>
        </p>
      )}
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="nome" angle={-40} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11, fill: ct.axis }} />
          <YAxis yAxisId="r" tick={{ fontSize: 12, fill: ct.axis }} />
          <YAxis yAxisId="p" orientation="right" unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: ct.axis }} />
          <ReferenceLine yAxisId="p" y={80} stroke={C.ambar} strokeDasharray="4 4" />
          <Tooltip content={tooltipColorido(ct, (v, n) => n === "% acumulado" ? fmtPctTip(v) : fmtMoedaTip(v))} />
          <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} formatter={legendaFormatter(ct.axis)} />
          <Bar yAxisId="r" dataKey="receita" name="Receita" fill={C.realizado} />
          <Line yAxisId="p" dataKey="acumulado" name="% acumulado" stroke={C.ambar} dot connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

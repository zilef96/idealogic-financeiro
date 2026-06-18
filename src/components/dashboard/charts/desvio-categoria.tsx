"use client"
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from "recharts"
import type { DesvioCategoria } from "@/lib/services/dashboard-service"
import { julgamentoDesvio } from "@/lib/services/execucao-service"
import { ChartTitulo } from "../chart-ui"
import { C } from "../cores"
import { useChartTheme, tooltipEstilo } from "../use-chart-theme"

// Cor por natureza: verde = melhor que o orçado; vermelho = pior. Sinal reforça a cor.
function rotulo(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return ""
  return `${n > 0 ? "+" : ""}${n.toFixed(0)}%`
}

export function DesvioCategoriaChart({ dados }: { dados: DesvioCategoria[] }) {
  const ct = useChartTheme()
  const data = dados.map((d) => ({ nome: d.nome, codigo: d.codigo, desvio: d.desvioPercentual ?? 0 }))
  return (
    <div>
      <ChartTitulo titulo="Desvio do Orçamento por Categoria" info="Quais grupos fugiram do planejado no ano, em %. A cor indica o resultado: vermelho = pior que o orçado; verde = melhor que o orçado (para receita, acima é bom; para custo/despesa, acima é ruim)." />
      <div className="-mt-1 mb-2 flex gap-3 text-xs" style={{ color: "rgb(var(--foreground))" }}>
        <span><span style={{ color: C.neg }}>■</span> pior que o orçado</span>
        <span><span style={{ color: C.pos }}>■</span> melhor que o orçado</span>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 28 }}>
          <XAxis type="number" unit="%" tick={{ fontSize: 12, fill: ct.axis }} />
          <YAxis type="category" dataKey="nome" width={150} tick={{ fontSize: 12, fill: ct.axis }} />
          <ReferenceLine x={0} stroke={ct.refLine} strokeWidth={1.5} />
          <Tooltip {...tooltipEstilo(ct)} formatter={(v) => `${Number(v).toFixed(1)}%`} />
          <Bar dataKey="desvio" name="Desvio %">
            {data.map((d, i) => {
              const j = julgamentoDesvio(d.codigo, d.desvio)
              return <Cell key={i} fill={j === "ruim" ? C.neg : j === "bom" ? C.pos : C.orcado} />
            })}
            <LabelList dataKey="desvio" position="right" fontSize={10} fill={ct.label} formatter={rotulo} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

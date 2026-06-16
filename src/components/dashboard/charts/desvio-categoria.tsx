"use client"
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from "recharts"
import type { DesvioCategoria } from "@/lib/services/dashboard-service"

// Verde = abaixo do orçado (economizou); vermelho = acima (estourou). Sinal reforça a cor.
function rotulo(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return ""
  return `${n > 0 ? "+" : ""}${n.toFixed(0)}%`
}

export function DesvioCategoriaChart({ dados }: { dados: DesvioCategoria[] }) {
  const data = dados.map((d) => ({ nome: d.nome, desvio: d.desvioPercentual ?? 0 }))
  return (
    <div>
      <h3 className="text-sm font-semibold">Desvio do Orçamento por Categoria (% no ano)</h3>
      <p className="mb-2 text-xs" style={{ color: "rgb(var(--muted))" }}>
        Quais grupos de custo/despesa fugiram do planejado. Vermelho à direita = gastou mais que o orçado; verde à esquerda = gastou menos.
      </p>
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 24 }}>
          <XAxis type="number" unit="%" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="nome" width={150} tick={{ fontSize: 12 }} />
          <ReferenceLine x={0} stroke="rgb(var(--muted))" strokeWidth={1.5} />
          <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
          <Bar dataKey="desvio" name="Desvio %">
            {data.map((d, i) => <Cell key={i} fill={d.desvio > 0 ? "#dc2626" : "#16a34a"} />)}
            <LabelList dataKey="desvio" position="right" fontSize={10} formatter={rotulo} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

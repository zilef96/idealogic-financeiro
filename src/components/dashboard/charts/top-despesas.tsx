"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { fmtMoedaTip } from "../formatos"

export function TopDespesasChart({ dados }: { dados: { nome: string; valor: number }[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">Top 5 Despesas</h3>
      <ResponsiveContainer width="100%" height={Math.max(160, dados.length * 44)}>
        <BarChart data={dados} layout="vertical" margin={{ left: 16 }}>
          <XAxis type="number" tick={{ fontSize: 12 }} hide />
          <YAxis type="category" dataKey="nome" width={160} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => fmtMoedaTip(v)} />
          <Bar dataKey="valor" name="Despesa" fill="#dc2626" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

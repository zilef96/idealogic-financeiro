"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import type { PontoMargem } from "@/lib/services/dashboard-service"
import { NOMES_MES, fmtPctTip } from "../formatos"

export function MargemChart({ dados }: { dados: PontoMargem[] }) {
  const data = dados.map((p) => ({ mes: NOMES_MES[p.mes - 1], margem: p.margem }))
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">Margem de Contribuição (%)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis unit="%" tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => fmtPctTip(v)} />
          <Line dataKey="margem" name="Margem" stroke="#16a34a" dot connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

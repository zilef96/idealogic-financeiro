"use client"
import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts"
import type { PontoSuperavit } from "@/lib/services/dashboard-service"
import { NOMES_MES, fmtMoedaTip } from "../formatos"

export function SuperavitChart({ dados }: { dados: PontoSuperavit[] }) {
  const data = dados.map((p) => ({ mes: NOMES_MES[p.mes - 1], superavit: p.superavit, acumulado: p.acumulado }))
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">Superávit / Déficit mensal</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="rgb(var(--border))" />
          <Tooltip formatter={(v) => fmtMoedaTip(v)} />
          <Bar dataKey="superavit" name="Superávit/Déficit">
            {data.map((d, i) => <Cell key={i} fill={(d.superavit ?? 0) >= 0 ? "#16a34a" : "#dc2626"} />)}
          </Bar>
          <Line dataKey="acumulado" name="Acumulado" stroke="#1e293b" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

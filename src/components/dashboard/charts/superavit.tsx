"use client"
import { ComposedChart, Bar, Line, Cell, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts"
import type { PontoSuperavit } from "@/lib/services/dashboard-service"
import { NOMES_MES, fmtMoedaTip } from "../formatos"

// Rótulo com sinal explícito (+/−): reforça superávit×déficit sem depender só da cor (WCAG).
function rotuloSinal(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n) || n === 0) return ""
  const milhares = Math.round(Math.abs(n) / 1000)
  return `${n > 0 ? "+" : "−"}${milhares}k`
}

export function SuperavitChart({ dados }: { dados: PontoSuperavit[] }) {
  const data = dados.map((p) => ({ mes: NOMES_MES[p.mes - 1], superavit: p.superavit, acumulado: p.acumulado }))
  return (
    <div>
      <h3 className="text-sm font-semibold">Superávit / Déficit mensal</h3>
      <p className="mb-2 text-xs" style={{ color: "rgb(var(--muted))" }}>
        Barra para cima e com <strong>+</strong> = sobrou dinheiro no mês; para baixo e com <strong>−</strong> = faltou. A linha mostra o acumulado do ano.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="rgb(var(--muted))" strokeWidth={1.5} />
          <Tooltip formatter={(v) => fmtMoedaTip(v)} />
          <Bar dataKey="superavit" name="Superávit/Déficit">
            {data.map((d, i) => <Cell key={i} fill={(d.superavit ?? 0) >= 0 ? "#16a34a" : "#dc2626"} />)}
            <LabelList dataKey="superavit" position="top" fontSize={10} formatter={rotuloSinal} />
          </Bar>
          <Line dataKey="acumulado" name="Acumulado" stroke="#1e293b" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

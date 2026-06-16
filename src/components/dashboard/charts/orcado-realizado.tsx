"use client"
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, CartesianGrid } from "recharts"
import type { PontoOrcadoRealizado } from "@/lib/services/dashboard-service"
import { NOMES_MES, fmtMoedaTip, fmtPctTip } from "../formatos"

export function OrcadoRealizadoChart({ dados }: { dados: PontoOrcadoRealizado[] }) {
  const data = dados.map((p) => ({ mes: NOMES_MES[p.mes - 1], orcado: p.orcado, realizado: p.realizado, desvio: p.desvioPercentual }))
  return (
    <div>
      <h3 className="text-sm font-semibold">Orçado × Realizado (faturamento de serviços)</h3>
      <p className="mb-2 text-xs" style={{ color: "rgb(var(--muted))" }}>O que planejamos receber (barra clara) versus o que de fato entrou (barra forte). A linha mostra a diferença em %.</p>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="r" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="p" orientation="right" unit="%" tick={{ fontSize: 12 }} />
          <ReferenceArea yAxisId="p" y1={-5} y2={5} fill="#16a34a" fillOpacity={0.06} />
          <Tooltip formatter={(v, n) => n === "desvio" ? fmtPctTip(v) : fmtMoedaTip(v)} />
          <Bar yAxisId="r" dataKey="orcado" name="Orçado" fill="#64748b" fillOpacity={0.5} />
          <Bar yAxisId="r" dataKey="realizado" name="Realizado" fill="#2563eb" />
          <Line yAxisId="p" dataKey="desvio" name="Desvio %" stroke="#d97706" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts"
import type { PontoTributo } from "@/lib/services/dashboard-service"
import { NOMES_MES, fmtMoedaTip, fmtPctTip } from "../formatos"

export function TributosChart({ dados }: { dados: PontoTributo[] }) {
  const data = dados.map((p) => ({ mes: NOMES_MES[p.mes - 1], pis: p.pis, cofins: p.cofins, issqn: p.issqn, carga: p.cargaPercentual }))
  return (
    <div>
      <h3 className="text-sm font-semibold">Carga Tributária (PIS · COFINS · ISSQN)</h3>
      <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>Quanto do faturamento vira imposto por mês. A linha é o peso total em % sobre o faturamento.</p>
      <p className="mb-2 text-xs" style={{ color: "rgb(var(--muted))" }}>CSLL/IRPJ: a definir (sem alíquota cadastrada).</p>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="r" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="p" orientation="right" unit="%" tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v, n) => n === "carga" ? fmtPctTip(v) : fmtMoedaTip(v)} />
          <Legend />
          <Bar yAxisId="r" dataKey="pis" name="PIS" stackId="t" fill="#94a3b8" />
          <Bar yAxisId="r" dataKey="cofins" name="COFINS" stackId="t" fill="#64748b" />
          <Bar yAxisId="r" dataKey="issqn" name="ISSQN" stackId="t" fill="#475569" />
          <Line yAxisId="p" dataKey="carga" name="Carga %" stroke="#1e293b" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

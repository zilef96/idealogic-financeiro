"use client"
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, CartesianGrid } from "recharts"
import type { PontoCaixa } from "@/lib/services/dashboard-service"
import { NOMES_MES, fmtMoedaTip } from "../formatos"

export function CaixaChart({ dados, caixaMinimo }: { dados: PontoCaixa[]; caixaMinimo: number }) {
  // separa realizado de projeção em duas séries para estilizar o traço
  const data = dados.map((p) => ({
    mes: NOMES_MES[p.mes - 1],
    realizado: p.projetado ? null : p.saldo,
    projetado: p.projetado ? p.saldo : null,
  }))
  // conecta a virada: o último ponto realizado também alimenta a série de projeção
  const idx = dados.findIndex((p) => p.projetado)
  if (idx > 0) {
    data[idx - 1].projetado = dados[idx - 1].saldo
  }
  return (
    <div>
      <h3 className="text-sm font-semibold">Evolução do Caixa</h3>
      <p className="mb-2 text-xs" style={{ color: "rgb(var(--muted))" }}>Quanto dinheiro a empresa tem em caixa mês a mês. O trecho tracejado é projeção; a linha vermelha é o mínimo de segurança.</p>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <ReferenceArea y1={0} y2={caixaMinimo} fill="#d97706" fillOpacity={0.08} />
          <ReferenceLine y={caixaMinimo} stroke="#dc2626" strokeDasharray="4 4"
            label={{ value: "Caixa mínimo", fontSize: 11, fill: "#dc2626", position: "insideTopRight" }} />
          <Tooltip formatter={(v) => fmtMoedaTip(v)} />
          <Area dataKey="realizado" name="Saldo realizado" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} connectNulls />
          <Line dataKey="projetado" name="Projeção" stroke="#2563eb" strokeDasharray="5 5" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

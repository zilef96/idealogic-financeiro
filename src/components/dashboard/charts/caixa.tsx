"use client"
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, CartesianGrid, Legend } from "recharts"
import type { PontoCaixa } from "@/lib/services/dashboard-service"
import { NOMES_MES, fmtMoedaTip } from "../formatos"
import { ChartTitulo, legendaFormatter } from "../chart-ui"
import { C } from "../cores"
import { useChartTheme, tooltipEstilo } from "../use-chart-theme"

export function CaixaChart({ dados, caixaMinimo }: { dados: PontoCaixa[]; caixaMinimo: number }) {
  const ct = useChartTheme()
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
      <ChartTitulo titulo="Evolução do Caixa" info="Saldo de caixa mês a mês. A área cheia é o saldo já realizado; o traço pontilhado é projeção dos meses futuros. A linha vermelha é o caixa mínimo de segurança e a faixa âmbar é a zona de risco (entre zero e o mínimo)." />
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: ct.axis }} />
          <YAxis tick={{ fontSize: 12, fill: ct.axis }} />
          <ReferenceArea y1={0} y2={caixaMinimo} fill={C.ambar} fillOpacity={0.08} />
          <ReferenceLine y={caixaMinimo} stroke={C.neg} strokeDasharray="4 4"
            label={{ value: "Caixa mínimo", fontSize: 11, fill: C.neg, position: "insideTopRight" }} />
          <Tooltip {...tooltipEstilo(ct)} formatter={(v) => fmtMoedaTip(v)} />
          <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} formatter={legendaFormatter(ct.axis)} />
          <Area dataKey="realizado" name="Saldo realizado" stroke={C.realizado} fill={C.realizado} fillOpacity={0.15} connectNulls />
          <Line dataKey="projetado" name="Projeção" stroke={C.realizado} strokeDasharray="5 5" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"
import { useState } from "react"
import type { DashboardPayload } from "@/lib/services/dashboard-service"
import { KpiHeader } from "./kpi-header"
import { AlertBar } from "./alert-bar"
import { NOMES_MES } from "./formatos"
import { OrcadoRealizadoChart } from "./charts/orcado-realizado"
import { SuperavitChart } from "./charts/superavit"
import { DesvioCategoriaChart } from "./charts/desvio-categoria"
import { CaixaChart } from "./charts/caixa"
import { MargemChart } from "./charts/margem"
import { CustoHoraChart } from "./charts/custo-hora"
import { CategoriasChart } from "./charts/categorias"
import { TopDespesasChart } from "./charts/top-despesas"
import { TributosChart } from "./charts/tributos"
import { ConcentracaoClientesChart } from "./charts/concentracao-clientes"

function Accordion({ titulo, pergunta, children }: { titulo: string; pergunta: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false)
  return (
    <section className="rounded-xl border border-border bg-card">
      <button type="button" onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span>
          <span className="font-display font-semibold">{titulo}</span>
          <span className="ml-2 text-xs" style={{ color: "rgb(var(--muted))" }}>{pergunta}</span>
        </span>
        <span>{aberto ? "−" : "+"}</span>
      </button>
      {aberto && <div className="space-y-6 px-4 pb-4">{children}</div>}
    </section>
  )
}

export function DashboardView({ payload }: { payload: DashboardPayload }) {
  const ref = payload.competenciaRef
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "rgb(var(--muted))" }}>
        <span>Competência de referência: {ref > 0 ? `${NOMES_MES[ref - 1]}/${payload.ano}` : "sem realizado lançado"}</span>
        <span className="flex items-center gap-2">
          <span>{ref}/12 meses do ano</span>
          <span className="h-1.5 w-24 overflow-hidden rounded-full" style={{ backgroundColor: "rgb(var(--muted) / 0.2)" }}>
            <span className="block h-full rounded-full" style={{ width: `${(ref / 12) * 100}%`, backgroundColor: "rgb(var(--muted))" }} />
          </span>
        </span>
      </div>
      <KpiHeader kpis={payload.kpis} />
      <AlertBar alertas={payload.alertas} />

      <Accordion titulo="Resultado & Aderência ao Orçamento" pergunta="Estamos no plano?">
        <OrcadoRealizadoChart dados={payload.orcadoRealizado} />
        <SuperavitChart dados={payload.superavit} />
        <DesvioCategoriaChart dados={payload.desvioCategorias} />
      </Accordion>
      <Accordion titulo="Liquidez & Caixa" pergunta="Temos fôlego?">
        <CaixaChart dados={payload.caixa} caixaMinimo={payload.caixaMinimo} />
      </Accordion>
      <Accordion titulo="Rentabilidade" pergunta="O negócio se paga?">
        <MargemChart dados={payload.margem} />
        <CustoHoraChart dados={payload.custoHora} />
      </Accordion>
      <Accordion titulo="Estrutura de Custos & Receitas" pergunta="Para onde vai o dinheiro?">
        <CategoriasChart raizes={payload.categorias} />
        <TopDespesasChart dados={payload.topDespesas} />
      </Accordion>
      <Accordion titulo="Carga Tributária" pergunta="Quanto o fisco leva?">
        <TributosChart dados={payload.tributos} />
      </Accordion>
      <Accordion titulo="Inteligência Comercial" pergunta="Quais clientes sustentam?">
        <ConcentracaoClientesChart dados={payload.concentracaoClientes} />
      </Accordion>
    </div>
  )
}

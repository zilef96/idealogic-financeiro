"use client"
import { useState } from "react"
import type { DashboardPayload } from "@/lib/services/dashboard-service"
import { KpiHeader } from "./kpi-header"
import { AlertBar } from "./alert-bar"
import { fmtValor } from "./formatos"
import { SeletorPeriodo } from "./seletor-periodo"
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

const MESES_LONGOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>{titulo}</h2>
      {children}
    </section>
  )
}

function Accordion({ titulo, pergunta, children, badge, inicialAberto = false }: { titulo: string; pergunta: string; children: React.ReactNode; badge?: string; inicialAberto?: boolean }) {
  const [aberto, setAberto] = useState(inicialAberto)
  return (
    <section className="rounded-xl border border-border bg-card">
      <button type="button" onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
        <span className="flex min-w-0 items-center gap-2">
          <span className="font-display truncate font-semibold">{titulo}</span>
          {badge && <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px]" style={{ color: "rgb(var(--muted))" }}>{badge}</span>}
          <span className="hidden text-xs sm:inline" style={{ color: "rgb(var(--muted))" }}>{pergunta}</span>
        </span>
        <span className="shrink-0 text-lg" style={{ color: "rgb(var(--muted))" }}>{aberto ? "−" : "+"}</span>
      </button>
      {aberto && <div className="grid gap-6 px-4 pb-5 lg:grid-cols-2">{children}</div>}
    </section>
  )
}

export function DashboardView({ payload }: { payload: DashboardPayload }) {
  const ref = payload.competenciaRef
  const mesSel = payload.mesSelecionado
  const subtitulo = mesSel
    ? `Visão de ${MESES_LONGOS[mesSel - 1]}/${payload.ano}`
    : ref > 0
      ? `Visão anual · ${ref} de 12 meses realizados`
      : "Visão anual · sem realizado lançado"

  return (
    <div className="space-y-6 overflow-x-clip">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Dashboard Financeiro</h1>
          <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>{subtitulo}</p>
        </div>
        <SeletorPeriodo ano={payload.ano} mes={mesSel} />
      </div>

      {/* Progresso do ano */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs" style={{ color: "rgb(var(--muted))" }}>
          <span>Progresso do ano</span>
          <span>{ref}/12 meses</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgb(var(--muted) / 0.18)" }}>
          <div className="h-full rounded-full" style={{ width: `${(ref / 12) * 100}%`, backgroundColor: "rgb(var(--info))" }} />
        </div>
        <p className="num text-xs" style={{ color: "rgb(var(--muted))" }}>
          YTD acumulado: {fmtValor(payload.faturamentoYtd, "moeda")} em faturamento de serviços
        </p>
      </div>

      <KpiHeader kpis={payload.kpis} />
      <AlertBar alertas={payload.alertas} />

      {/* Decomposição por tema */}
      <Secao titulo="Análises por grupo">
        <Accordion titulo="Resultado, caixa e margem" pergunta="Como está o resultado?" inicialAberto>
          <SuperavitChart dados={payload.superavit} />
          <CaixaChart dados={payload.caixa} caixaMinimo={payload.caixaMinimo} />
          <MargemChart dados={payload.margem} />
          <OrcadoRealizadoChart dados={payload.orcadoRealizado} />
        </Accordion>
        <Accordion titulo="Disciplina Orçamentária" pergunta="Estamos no plano?">
          <DesvioCategoriaChart dados={payload.desvioCategorias} />
          <CustoHoraChart dados={payload.custoHora} />
        </Accordion>
        <Accordion titulo="Receitas & Clientes" pergunta="Quais clientes sustentam?" badge={`${payload.concentracaoClientes.length} clientes`}>
          <ConcentracaoClientesChart dados={payload.concentracaoClientes} />
        </Accordion>
        <Accordion titulo="Custos & Despesas" pergunta="Para onde vai o dinheiro?">
          <CategoriasChart raizes={payload.categorias} />
          <TopDespesasChart dados={payload.topDespesas} />
        </Accordion>
        <Accordion titulo="Tributos" pergunta="Quanto o fisco leva?">
          <TributosChart dados={payload.tributos} />
        </Accordion>
      </Secao>
    </div>
  )
}

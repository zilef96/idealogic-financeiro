"use client"
import type { RelatorioPayload } from "@/lib/services/relatorio-service"
import { Cabecalho } from "./cabecalho"
import { Demonstrativos } from "./demonstrativos"
import { FluxoTabela } from "./fluxo-tabela"
import { IndicadoresFinanceiros } from "./indicadores-financeiros"
import { FluxoLinhas } from "./fluxo-linhas"

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>{titulo}</h2>
      {children}
    </section>
  )
}

// Reprodução da seção FINANCEIRO do deck, sem duplicar as análises da Dashboard.
// Ordem: 1) Demonstrativo de Resultados, 2) Indicadores Financeiros,
// 3) Gráfico do fluxo mensal, 4) Tabela com todos os valores.
export function RelatorioView({ payload }: { payload: RelatorioPayload }) {
  return (
    <div className="space-y-8 overflow-x-clip">
      <Cabecalho ano={payload.ano} mes={payload.mes} status={payload.status} />

      <Secao titulo="Demonstrativo de Resultados">
        <Demonstrativos dados={payload} />
      </Secao>

      <Secao titulo="Indicadores Financeiros">
        <IndicadoresFinanceiros dados={payload} />
      </Secao>

      <Secao titulo="Fluxo de Caixa Mensal">
        <FluxoLinhas fluxo={payload.fluxo} />
      </Secao>

      <Secao titulo="Fluxo de Caixa Mensal — valores mês a mês">
        <FluxoTabela fluxo={payload.fluxo} />
      </Secao>
    </div>
  )
}

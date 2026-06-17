import type { Kpi } from "@/lib/services/dashboard-service"
import { fmtValor, fmtDelta, corDelta } from "./formatos"
import { InfoTooltip } from "./chart-ui"

// Explicação em linguagem de sócio (não-contábil) para cada KPI.
const AJUDA: Record<string, string> = {
  faturamento: "Receita de serviços (faturamento bruto menos cotas e tributos sobre faturamento). Na visão do ano é o acumulado; na visão do mês, só o mês escolhido.",
  superavit: "O que sobra depois de custos, despesas e distribuição. Positivo = superávit; negativo = déficit.",
  margem: "De cada R$ faturado em serviços, quanto sobra como resultado. Quanto maior, mais saudável o negócio.",
  caixa: "Dinheiro disponível em caixa na competência. A folga é a distância até o caixa mínimo de segurança.",
  tributos: "Peso de PIS, COFINS e ISSQN sobre o faturamento de serviços. CSLL/IRPJ ainda não entram (sem alíquota cadastrada).",
  aderencia: "Percentual de itens cujo realizado ficou dentro de ±5% do orçado. Mostra disciplina de execução.",
}

export function KpiHeader({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((k) => (
        <div key={k.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-3 sm:p-3.5">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[11px] font-medium uppercase tracking-wide" style={{ color: "rgb(var(--muted))" }}>{k.rotulo}</span>
            {AJUDA[k.id] && <InfoTooltip texto={AJUDA[k.id]} />}
          </div>
          <div className="num font-display mt-1.5 text-lg font-semibold sm:text-xl"
            style={k.pendente ? { color: "rgb(var(--muted) / 0.6)" } : undefined}>{fmtValor(k.valor, k.formato)}</div>
          <div className="mt-auto pt-2">
            {k.referencia != null && (
              <div className="num text-[11px]" style={{ color: "rgb(var(--muted))" }}>
                {k.referenciaRotulo}: {fmtValor(k.referencia, k.formato === "percent" ? "percent" : "moeda")}
              </div>
            )}
            <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px]">
              {k.deltas.map((d) => (
                <span key={d.rotulo} className="num" style={{ color: corDelta(d.valor, d.inverted) }}>
                  {fmtDelta(d.valor, d.formato)} <span className="font-sans" style={{ color: "rgb(var(--muted))" }}>{d.rotulo}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

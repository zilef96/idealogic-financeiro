import type { RelatorioPayload } from "@/lib/services/relatorio-service"
import { fmtValor } from "@/components/dashboard/formatos"

const MESES_LONGOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

// Um termo da fórmula: valor em cima, rótulo embaixo (espelha o print do deck).
function Termo({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="flex flex-col">
      <span className="num text-base font-medium">{fmtValor(valor, "moeda")}</span>
      <span className="text-[11px]" style={{ color: "rgb(var(--muted))" }}>{rotulo}</span>
    </div>
  )
}

function Op({ children }: { children: React.ReactNode }) {
  return <span className="pb-4 text-lg" style={{ color: "rgb(var(--muted))" }}>{children}</span>
}

// Grupo de conta bancária (só leitura): ponto de cor + nome + linhas de saldo.
function ContaBanco({ cor, nome, linhas }: { cor: string; nome: string; linhas: [string, number][] }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cor }} />
        <span className="text-sm font-medium">{nome}</span>
      </div>
      <div className="mt-1 space-y-0.5 pl-[18px]">
        {linhas.map(([rot, val]) => (
          <div key={rot} className="flex items-center justify-between text-sm">
            <span style={{ color: "rgb(var(--muted))" }}>{rot}</span>
            <span className="num">{fmtValor(val, "moeda")}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Indicadores Financeiros + Contas juntos (como no deck): à esquerda o Resultado
// Operacional com a fórmula e as margens; à direita o saldo geral e as contas
// (somente leitura nesta página).
export function IndicadoresFinanceiros({ dados }: { dados: RelatorioPayload }) {
  const rl = dados.receitaLiquida
  const custos = dados.custos.total
  const despesas = dados.despesas.total
  const dividendos = dados.dividendos
  const resultado = rl - custos - despesas - dividendos
  const deficit = resultado < 0
  const corRes = deficit ? "#c23b32" : "#128a67"

  const mesNome = MESES_LONGOS[dados.mes - 1].toUpperCase()
  const dia = new Date(dados.ano, dados.mes, 0).getDate() // último dia do mês
  const dataRef = `${String(dia).padStart(2, "0")}/${String(dados.mes).padStart(2, "0")}`
  const s = dados.saldos

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      {/* Indicadores */}
      <div className="space-y-5 rounded-xl border border-border bg-card p-5">
        {/* Resultado Operacional — fórmula completa */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>Resultado Operacional</p>
          <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-3">
            <Termo valor={rl} rotulo="Receita Líquida" />
            <Op>−</Op>
            <Termo valor={custos} rotulo="Custos" />
            <Op>−</Op>
            <Termo valor={despesas} rotulo="Despesas" />
            <Op>−</Op>
            <Termo valor={dividendos} rotulo="Dividendos" />
            <Op>=</Op>
            <div className="flex flex-col">
              <span className="num text-xl font-bold" style={{ color: corRes }}>{fmtValor(resultado, "moeda")}</span>
              <span className="text-[11px]" style={{ color: "rgb(var(--muted))" }}>Resultado</span>
            </div>
          </div>
          <p className="mt-3 text-sm">
            No mês de <span className="font-semibold">{mesNome}</span>, a Idealogic gerou{" "}
            <span className="font-semibold" style={{ color: corRes }}>{deficit ? "DÉFICIT" : "SUPERÁVIT"}</span>.
          </p>
        </div>

        {/* Margens */}
        <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>Margem Bruta</p>
            <p className="num mt-1 text-2xl font-semibold">{fmtValor(dados.margemBruta, "percent")}</p>
            <p className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
              O que sobra da receita após os custos com pessoas faturáveis. Mede a eficiência operacional.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>Margem Líquida</p>
            <p className="num mt-1 text-2xl font-semibold">{fmtValor(dados.margemLiquida, "percent")}</p>
            <p className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
              O lucro final: quanto do faturamento se converte em lucro após custos, despesas e tributos.
            </p>
          </div>
        </div>
      </div>

      {/* Saldo geral + Contas (somente leitura) */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>Saldo geral ({dataRef})</p>
        <p className="num mt-0.5 text-2xl font-bold">{fmtValor(s.saldoGeral, "moeda")}</p>
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>Contas da Idealogic</p>
          <ContaBanco cor="#22c55e" nome="Sicredi" linhas={[["Conta corrente", s.sicrediCc], ["Aplicação bancária", s.sicrediAplicacao]]} />
          <ContaBanco cor="#1e3a8a" nome="Banrisul" linhas={[["Conta corrente", s.banrisulCc]]} />
        </div>
      </div>
    </div>
  )
}

import type { RelatorioPayload } from "@/lib/services/relatorio-service"
import { fmtValor } from "@/components/dashboard/formatos"

function Linha({ rotulo, valor, forte = false, recuo = false }: { rotulo: string; valor: number; forte?: boolean; recuo?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 text-sm ${forte ? "font-semibold" : ""}`}>
      <span className={recuo ? "pl-4" : ""} style={recuo ? { color: "rgb(var(--muted))" } : undefined}>{rotulo}</span>
      <span className="num">{fmtValor(valor, "moeda")}</span>
    </div>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>{titulo}</h3>
      {children}
    </div>
  )
}

export function Demonstrativos({ dados }: { dados: RelatorioPayload }) {
  const c = dados.custos
  const d = dados.despesas
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Coluna esquerda: receita, tributos, custos */}
      <div className="space-y-4">
        <Bloco titulo="Receita (+)">
          <Linha rotulo="Faturamento" valor={dados.faturamento} />
          <Linha rotulo="Cotas de Sócios" valor={dados.cotas} />
          <Linha rotulo="Total de Receitas" valor={dados.totalReceitas} forte />
        </Bloco>
        <Bloco titulo="(−) Tributos sobre o Faturamento">
          <Linha rotulo="ISSQN" valor={dados.issqn} />
          <Linha rotulo="COFINS" valor={dados.cofins} />
          <Linha rotulo="PIS" valor={dados.pis} />
          <Linha rotulo="Receita Líquida" valor={dados.receitaLiquida} forte />
          <p className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
            Receita Líquida = Total de Receitas − (PIS + COFINS + ISSQN). Não inclui CSLL/IRPJ.
          </p>
        </Bloco>
        <Bloco titulo="(−) Custos Totais">
          <Linha rotulo="Remuneração" valor={c.remuneracao} />
          <Linha rotulo="Tributos, Encargos e Provisões" valor={c.tributosEncargosProvisoes} />
          <Linha rotulo="Benefícios" valor={c.beneficios} />
          <Linha rotulo="Total de Custos" valor={c.total} forte />
        </Bloco>
      </div>
      {/* Coluna direita: despesas, dividendos */}
      <div className="space-y-4">
        <Bloco titulo="(−) Despesas Totais">
          <Linha rotulo="Remuneração" valor={d.remuneracao} />
          <Linha rotulo="Cultura & Pessoas" valor={d.culturaPessoas} />
          <Linha rotulo="Custos operacionais" valor={d.custosOperacionais} />
          <Linha rotulo="Serviços de cloud" valor={d.cloud} recuo />
          <Linha rotulo="SaaS e licenças" valor={d.saas} recuo />
          <Linha rotulo="Assessorias" valor={d.assessorias} recuo />
          <Linha rotulo="Despesas Financeiras" valor={d.despesasFinanceiras} />
          <Linha rotulo="Marketing Social Institucional" valor={d.marketingSocial} />
          <Linha rotulo="Marketing Comercial" valor={d.marketingComercial} />
          <Linha rotulo="Espaço Gauten" valor={d.espacoGauten} />
          <Linha rotulo="Total de Despesas" valor={d.total} forte />
        </Bloco>
        <Bloco titulo="(−) Dividendos">
          <Linha rotulo="Distribuição de lucros antecipada" valor={dados.dividendos} />
        </Bloco>
      </div>
    </div>
  )
}

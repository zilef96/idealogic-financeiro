import type { FluxoMensal } from "@/lib/services/relatorio-service"
import { NOMES_MES, fmtValor } from "@/components/dashboard/formatos"

const COLUNAS: { chave: "receitas" | "cotas" | "tributos" | "custos" | "despesas" | "dividendos" | "resultado"; rotulo: string }[] = [
  { chave: "receitas", rotulo: "Receitas" },
  { chave: "cotas", rotulo: "Cotas Sócios" },
  { chave: "tributos", rotulo: "Tributos" },
  { chave: "custos", rotulo: "Custos" },
  { chave: "despesas", rotulo: "Despesas" },
  { chave: "dividendos", rotulo: "Dividendos" },
  { chave: "resultado", rotulo: "Resultado" },
]

function celulaResultado(valor: number) {
  const negativo = valor < 0
  return <span className="num" style={{ color: negativo ? "#c23b32" : undefined, fontWeight: negativo ? 600 : undefined }}>{fmtValor(valor, "moeda")}</span>
}

export function FluxoTabela({ fluxo }: { fluxo: FluxoMensal }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left" style={{ color: "rgb(var(--muted))" }}>
            <th className="px-3 py-2 font-medium">Mês</th>
            {COLUNAS.map((c) => <th key={c.chave} className="px-3 py-2 text-right font-medium">{c.rotulo}</th>)}
          </tr>
        </thead>
        <tbody>
          {fluxo.meses.map((m) => (
            <tr key={m.mes} className="border-b border-border/60">
              <td className="px-3 py-1.5">{NOMES_MES[m.mes - 1]}</td>
              {COLUNAS.map((c) => (
                <td key={c.chave} className="px-3 py-1.5 text-right">
                  {c.chave === "resultado" ? celulaResultado(m.resultado) : <span className="num">{fmtValor(m[c.chave], "moeda")}</span>}
                </td>
              ))}
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="px-3 py-2">TOTAL</td>
            {COLUNAS.map((c) => (
              <td key={c.chave} className="px-3 py-2 text-right">
                {c.chave === "resultado" ? celulaResultado(fluxo.total.resultado) : <span className="num">{fmtValor(fluxo.total[c.chave], "moeda")}</span>}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

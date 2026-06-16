"use client"
import { useState } from "react"
import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"
import { TabelaExecucao } from "./tabela-execucao"
import { CardsIndicadores } from "./cards-indicadores"
import { margemContribuicao } from "@/lib/services/execucao-service"

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

// Indicadores do mês a partir dos totais (realizado) dos blocos raiz.
function indicadoresDoMes(linhas: LinhaExecucao[], mes: number) {
  const bloco = (cod: string) => linhas.find((l) => l.codigo === cod && l.mes === mes && l.isGrupo)?.realizado ?? 0
  const receita = bloco("10000"), custos = bloco("20000"), despesas = bloco("30000")
  const superavit = receita - custos - despesas
  return [
    { rotulo: "Receita realizada", valor: receita },
    { rotulo: "Custos", valor: custos },
    { rotulo: "Despesas", valor: despesas },
    { rotulo: "Superávit", valor: superavit },
    { rotulo: "Margem", valor: margemContribuicao(superavit, receita), pct: true },
  ]
}

export function AbasExecucao({ ano, mesAtual, linhas }: { ano: number; mesAtual: number; linhas: LinhaExecucao[] }) {
  const [aba, setAba] = useState<"mes" | "periodo">("mes")
  return (
    <div className="space-y-4">
      <div role="tablist" className="flex gap-2 border-b border-border">
        <button role="tab" aria-selected={aba === "mes"} onClick={() => setAba("mes")}
          className={`px-3 py-2 text-sm ${aba === "mes" ? "border-b-2 border-foreground font-medium" : "text-muted"}`}>
          Mês atual ({MESES[mesAtual - 1]})
        </button>
        <button role="tab" aria-selected={aba === "periodo"} onClick={() => setAba("periodo")}
          className={`px-3 py-2 text-sm ${aba === "periodo" ? "border-b-2 border-foreground font-medium" : "text-muted"}`}>
          Período (12 meses)
        </button>
      </div>
      {aba === "mes" ? (
        <div className="space-y-4">
          <CardsIndicadores indicadores={indicadoresDoMes(linhas, mesAtual)} />
          <TabelaExecucao ano={ano} linhas={linhas.filter((l) => l.mes === mesAtual)} meses={[mesAtual]} editavel />
        </div>
      ) : (
        <TabelaExecucao ano={ano} linhas={linhas} meses={Array.from({ length: 12 }, (_, i) => i + 1)} editavel={false} />
      )}
    </div>
  )
}

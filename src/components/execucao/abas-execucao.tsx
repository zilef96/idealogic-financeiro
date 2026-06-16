"use client"
import { useState } from "react"
import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"
import type { Indicador } from "@/lib/services/execucao-service"
import { TabelaExecucao } from "./tabela-execucao"
import { CardsIndicadores } from "./cards-indicadores"
import { TabelaIndicadores } from "./tabela-indicadores"
import { ProjecaoCaixa } from "./projecao-caixa"

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function AbasExecucao({
  ano, mesAtual, linhas, indicadoresPorMes, projecao,
}: {
  ano: number; mesAtual: number; linhas: LinhaExecucao[]; indicadoresPorMes: Indicador[][]; projecao: number[]
}) {
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
          <CardsIndicadores indicadores={indicadoresPorMes[mesAtual - 1] ?? []} />
          <TabelaExecucao ano={ano} linhas={linhas.filter((l) => l.mes === mesAtual)} meses={[mesAtual]} editavel />
        </div>
      ) : (
        <div className="space-y-4">
          <TabelaExecucao ano={ano} linhas={linhas} meses={Array.from({ length: 12 }, (_, i) => i + 1)} editavel={false} />
          <TabelaIndicadores indicadoresPorMes={indicadoresPorMes} />
          <ProjecaoCaixa saldos={projecao} />
        </div>
      )}
    </div>
  )
}

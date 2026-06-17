"use client"
import { useState } from "react"
import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"
import type { Indicador } from "@/lib/services/execucao-service"
import type { StatusFechamento } from "@/lib/repositories/fechamento-repository"
import type { GrupoOrcamento } from "@/lib/types"
import { TabelaExecucao } from "./tabela-execucao"
import { CardsIndicadores } from "./cards-indicadores"
import { TabelaIndicadores } from "./tabela-indicadores"
import { AcaoFechamento } from "./acao-fechamento"
import { CheckInPendencias } from "./check-in-pendencias"
import { NovoItem } from "@/components/orcamento/novo-item"

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function BotaoCadeado({ editavel, onToggle }: { editavel: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium hover:bg-faint">
      {editavel ? "🔓 Editando" : "🔒 Travado"}
    </button>
  )
}

export function AbasExecucao({
  ano, mesAtual, linhas, statusPorMes, grupos, indicadoresOrcadoPorMes, indicadoresRealizadoPorMes,
}: {
  ano: number
  mesAtual: number
  linhas: LinhaExecucao[]
  statusPorMes: Record<number, StatusFechamento>
  grupos: GrupoOrcamento[]
  indicadoresOrcadoPorMes: Indicador[][]
  indicadoresRealizadoPorMes: Indicador[][]
}) {
  const [aba, setAba] = useState<"mes" | "periodo">("mes")
  const [mesSel, setMesSel] = useState(mesAtual)
  const [editavel, setEditavel] = useState(false)
  const [ocultarFechados, setOcultarFechados] = useState(true)
  const meses = Array.from({ length: 12 }, (_, i) => i + 1)
  const fechado = statusPorMes[mesSel] === "concluido"
  const podeEditar = editavel && !fechado
  const mesesOcultos = ocultarFechados ? meses.filter((m) => statusPorMes[m] === "concluido") : []

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex gap-2 border-b border-border">
        <button role="tab" aria-selected={aba === "mes"} onClick={() => setAba("mes")}
          className={`px-3 py-2 text-sm ${aba === "mes" ? "border-b-2 border-foreground font-medium" : "text-muted"}`}>
          Visão mês
        </button>
        <button role="tab" aria-selected={aba === "periodo"} onClick={() => setAba("periodo")}
          className={`px-3 py-2 text-sm ${aba === "periodo" ? "border-b-2 border-foreground font-medium" : "text-muted"}`}>
          Período (12 meses)
        </button>
      </div>
      {aba === "mes" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <select value={mesSel} onChange={(e) => setMesSel(Number(e.target.value))}
              className="rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium">
              {meses.map((m) => <option key={m} value={m}>{MESES[m - 1]}</option>)}
            </select>
            <BotaoCadeado editavel={editavel} onToggle={() => setEditavel((v) => !v)} />
            {podeEditar && <NovoItem grupos={grupos} endpoint="/api/execucao/item" />}
            <div className="ml-auto"><AcaoFechamento ano={ano} mes={mesSel} status={statusPorMes[mesSel]} /></div>
          </div>
          <CheckInPendencias linhas={linhas} mes={mesSel} />
          <CardsIndicadores indicadores={indicadoresRealizadoPorMes[mesSel - 1] ?? []} />
          <TabelaExecucao ano={ano} linhas={linhas.filter((l) => l.mes === mesSel)} meses={[mesSel]} editavel={podeEditar} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <BotaoCadeado editavel={editavel} onToggle={() => setEditavel((v) => !v)} />
            <label className="flex items-center gap-2 text-[12px]" style={{ color: "rgb(var(--muted))" }}>
              <input type="checkbox" checked={ocultarFechados} onChange={(e) => setOcultarFechados(e.target.checked)} />
              Ocultar meses fechados
            </label>
          </div>
          <TabelaExecucao ano={ano} linhas={linhas} meses={meses} editavel={editavel} mesesOcultos={mesesOcultos} />
          <TabelaIndicadores orcado={indicadoresOrcadoPorMes} realizado={indicadoresRealizadoPorMes} />
        </div>
      )}
    </div>
  )
}

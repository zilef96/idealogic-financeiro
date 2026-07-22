"use client"
import { useState } from "react"
import { Lock, LockOpen, Eye, EyeOff } from "lucide-react"
import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"
import type { Indicador } from "@/lib/services/execucao-service"
import type { StatusFechamento } from "@/lib/repositories/fechamento-repository"
import type { GrupoOrcamento } from "@/lib/types"
import type { SeriesParametros } from "@/lib/repositories/parametro-repository"
import { btn } from "@/components/ui/botao"
import { ModalParametros } from "./modal-parametros"
import { TabelaExecucao } from "./tabela-execucao"
import { CardsIndicadores } from "./cards-indicadores"
import { AcaoFechamento } from "./acao-fechamento"
import { CheckInPendencias } from "./check-in-pendencias"
import { MenuAdicionar } from "./menu-adicionar"
import { AlteracoesNaoSalvasProvider, useAlteracoesNaoSalvas } from "./alteracoes-nao-salvas"

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function BotaoCadeado({ editavel, onToggle }: { editavel: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className={btn}>
      {editavel
        ? <><LockOpen size={16} strokeWidth={2} aria-hidden /> Em edição</>
        : <><Lock size={16} strokeWidth={2} aria-hidden /> Somente leitura</>}
    </button>
  )
}

type Auditoria = { concluidoPor: string | null; concluidoEm: string | null; reabertoPor: string | null; reabertoEm: string | null }

export function AbasExecucao(props: React.ComponentProps<typeof AbasExecucaoInterno>) {
  return (
    <AlteracoesNaoSalvasProvider>
      <AbasExecucaoInterno {...props} />
    </AlteracoesNaoSalvasProvider>
  )
}

function AbasExecucaoInterno({
  ano, mesAtual, linhas, series, statusPorMes, grupos, auditoriaPorMes, indicadoresOrcadoPorMes, indicadoresRealizadoPorMes,
}: {
  ano: number
  mesAtual: number
  linhas: LinhaExecucao[]
  series: SeriesParametros
  statusPorMes: Record<number, StatusFechamento>
  grupos: GrupoOrcamento[]
  auditoriaPorMes: Record<number, Auditoria>
  indicadoresOrcadoPorMes: Indicador[][]
  indicadoresRealizadoPorMes: Indicador[][]
}) {
  const [aba, setAba] = useState<"mes" | "periodo">("mes")
  const [mesSel, setMesSel] = useState(mesAtual)
  const [editavel, setEditavel] = useState(false)
  const [mostrarOrcadoFechados, setMostrarOrcadoFechados] = useState(false)
  const { confirmarSeHaAlteracoes } = useAlteracoesNaoSalvas()
  const trocarAba = (nova: "mes" | "periodo") => { if (aba !== nova && confirmarSeHaAlteracoes()) setAba(nova) }
  const alternarCadeado = () => {
    if (editavel && !confirmarSeHaAlteracoes("Há alterações não salvas. Travar a edição mesmo assim?")) return
    setEditavel((v) => !v)
  }
  const meses = Array.from({ length: 12 }, (_, i) => i + 1)
  const fechado = statusPorMes[mesSel] === "concluido"
  const podeEditar = editavel && !fechado
  // Meses abertos sempre exibem orçado. O orçado dos meses fechados (referência congelada)
  // fica oculto por padrão e é revelado sob demanda pelo botão.
  const mesesFechados = meses.filter((m) => statusPorMes[m] === "concluido")
  const mesesSemOrcado = mostrarOrcadoFechados ? [] : mesesFechados

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex gap-2 border-b border-border">
        <button role="tab" aria-selected={aba === "mes"} onClick={() => trocarAba("mes")}
          className={`px-3 py-2 text-sm ${aba === "mes" ? "border-b-2 border-foreground font-medium" : "text-muted"}`}>
          Visão mês
        </button>
        {/* Período comparativo (12 meses) é inviável no telefone — a Visão mês já cobre a navegação
            mês a mês no mobile. Mantida só no desktop (≥901px). */}
        <button role="tab" aria-selected={aba === "periodo"} onClick={() => trocarAba("periodo")}
          className={`px-3 py-2 text-sm max-[900px]:hidden ${aba === "periodo" ? "border-b-2 border-foreground font-medium" : "text-muted"}`}>
          Período (12 meses)
        </button>
      </div>
      {aba === "mes" ? (
        <div className="space-y-4">
          {/* Cabeçalho de seção: título + seletor de mês. As ações de edição (cadeado, adicionar)
              vão para a barra logo acima da tabela, junto do expandir/recolher — mais perto da tabela
              e longe dos cards de indicadores do topo. */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-[15px] font-semibold">Execução do mês</h2>
            <select value={mesSel} onChange={(e) => setMesSel(Number(e.target.value))}
              className="h-8 rounded-full border border-border bg-card px-3 text-[13px] font-medium">
              {meses.map((m) => <option key={m} value={m}>{MESES[m - 1]}</option>)}
            </select>
            <ModalParametros ano={ano} mesInicial={mesSel} series={series} />
          </div>
          {/* Ação de ciclo de vida do mês (concluir/reabrir) — destacada e separada dos CRUDs por ser irreversível. */}
          <AcaoFechamento ano={ano} mes={mesSel} status={statusPorMes[mesSel]} auditoria={auditoriaPorMes[mesSel]} />
          <CheckInPendencias linhas={linhas} mes={mesSel} />
          <CardsIndicadores indicadores={indicadoresRealizadoPorMes[mesSel - 1] ?? []} />
          {/* Mês fechado não tem edição: oculta cadeado e adicionar (resta o histórico/reabrir na AcaoFechamento). */}
          <TabelaExecucao ano={ano} linhas={linhas.filter((l) => l.mes === mesSel)} meses={[mesSel]} editavel={podeEditar}
            acoesEdicao={fechado ? undefined : <>
              <BotaoCadeado editavel={editavel} onToggle={alternarCadeado} />
              <MenuAdicionar grupos={grupos} statusPorMes={statusPorMes} mesPadrao={mesSel} />
            </>} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <BotaoCadeado editavel={editavel} onToggle={alternarCadeado} />
            <MenuAdicionar grupos={grupos} statusPorMes={statusPorMes} mesPadrao={1} />
            <ModalParametros ano={ano} mesInicial={mesAtual} series={series} />
            {mesesFechados.length > 0 && (
              <button type="button" onClick={() => setMostrarOrcadoFechados((v) => !v)} className={btn}>
                {mostrarOrcadoFechados
                  ? <><EyeOff size={16} strokeWidth={2} aria-hidden /> Ocultar orçado dos fechados</>
                  : <><Eye size={16} strokeWidth={2} aria-hidden /> Mostrar orçado dos fechados</>}
              </button>
            )}
          </div>
          <TabelaExecucao ano={ano} linhas={linhas} meses={meses} editavel={editavel} mesesSemOrcado={mesesSemOrcado} mesesFechados={mesesFechados}
            indicadoresOrcado={indicadoresOrcadoPorMes} indicadoresRealizado={indicadoresRealizadoPorMes} />
        </div>
      )}
    </div>
  )
}

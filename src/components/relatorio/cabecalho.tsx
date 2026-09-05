"use client"
import { SeletorPeriodo } from "@/components/dashboard/seletor-periodo"
import type { StatusRelatorio } from "@/lib/services/relatorio-service"

const MESES_LONGOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

function BadgeStatus({ status }: { status: StatusRelatorio }) {
  const consolidado = status === "concluido"
  const rotulo = consolidado ? "Consolidado" : "Em apuração"
  // Verde (sucesso) para consolidado; âmbar (atenção) para em apuração.
  const cor = consolidado ? "#128a67" : "#b9790e"
  return (
    <span
      className="shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ color: cor, borderColor: cor }}
      title={consolidado ? "Mês fechado; versão consolidada do relatório." : "Mês aberto; dados ainda podem mudar."}
    >
      {rotulo}
    </span>
  )
}

export function Cabecalho({ ano, mes, status }: { ano: number; mes: number; status: StatusRelatorio }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-semibold">
          Relatório de Informação – {MESES_LONGOS[mes - 1]} de {ano}
        </h1>
        <BadgeStatus status={status} />
      </div>
      <SeletorPeriodo ano={ano} mes={mes} permitirTodos={false} />
    </div>
  )
}

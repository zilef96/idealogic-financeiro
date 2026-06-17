"use client"
import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"
import { contarPendencias } from "@/lib/services/execucao-service"

export function CheckInPendencias({ linhas, mes }: { linhas: LinhaExecucao[]; mes: number }) {
  const n = contarPendencias(linhas, mes)
  const pendentes = linhas.filter((l) => !l.isGrupo && l.mes === mes && l.orcado > 0 && l.realizado == null)
  if (n === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-2 text-[13px]" style={{ color: "rgb(var(--pos))" }}>
        ✓ Todos os itens com orçado têm realizado neste mês.
      </div>
    )
  }
  return (
    <details className="rounded-xl border border-border bg-card px-4 py-2 text-[13px]">
      <summary className="cursor-pointer font-medium" style={{ color: "rgb(var(--amber))" }}>
        Faltam {n} {n === 1 ? "item" : "itens"} sem realizado neste mês
      </summary>
      <ul className="mt-2 space-y-1" style={{ color: "rgb(var(--muted))" }}>
        {pendentes.map((l) => (
          <li key={l.codigo}><span className="num text-[11px]">{l.codigo}</span> — {l.nome}</li>
        ))}
      </ul>
    </details>
  )
}

"use client"
import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"
import { contarPendencias } from "@/lib/services/execucao-service"

export function CheckInPendencias({ linhas, mes }: { linhas: LinhaExecucao[]; mes: number }) {
  const n = contarPendencias(linhas, mes)
  const ok = n === 0
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-2 text-[13px]"
      style={{ color: ok ? "rgb(var(--pos))" : "rgb(var(--amber))" }}>
      {ok
        ? "✓ Todos os itens com orçado têm realizado neste mês."
        : `Faltam ${n} ${n === 1 ? "item" : "itens"} sem realizado neste mês — veja os badges nas categorias.`}
    </div>
  )
}

"use client"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"
import { contarPendencias } from "@/lib/services/execucao-service"

// Check-in de pendências da Visão mês: resume quantos itens com orçado ainda não
// têm realizado lançado no mês. Estrutura ícone + mensagem (+ contagem em destaque),
// com semântica de cor consistente com os badges das categorias
// (âmbar = pendência, verde = tudo lançado). role="status" para leitores de tela.
export function CheckInPendencias({ linhas, mes }: { linhas: LinhaExecucao[]; mes: number }) {
  const n = contarPendencias(linhas, mes)
  const ok = n === 0

  if (ok) {
    return (
      <div role="status"
        className="flex items-center gap-3 rounded-xl border px-4 py-3 text-[13px] font-semibold"
        style={{ borderColor: "rgb(var(--pos) / 0.35)", background: "rgb(var(--pos-soft))", color: "rgb(var(--pos))" }}>
        <CheckCircle2 size={18} strokeWidth={2.2} aria-hidden />
        Tudo lançado neste mês
      </div>
    )
  }

  const umItem = n === 1
  return (
    <div role="status"
      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-[13px] font-semibold"
      style={{ borderColor: "rgb(var(--amber) / 0.4)", background: "rgb(var(--amber-soft))", color: "rgb(var(--foreground))" }}>
      <AlertTriangle size={18} strokeWidth={2.2} aria-hidden style={{ color: "rgb(var(--amber))" }} />
      {umItem ? "1 item aguardando lançamento" : `${n} itens aguardando lançamento`}
    </div>
  )
}

"use client"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { NOMES_MES } from "./formatos"

const MESES_LONGOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

export function SeletorPeriodo({ ano, mes, permitirTodos = true }: { ano: number; mes: number | null; permitirTodos?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function navegar(patch: { ano?: number; mes?: number | null }) {
    const q = new URLSearchParams(params.toString())
    if (patch.ano != null) q.set("ano", String(patch.ano))
    if ("mes" in patch) {
      if (patch.mes == null) q.delete("mes")
      else q.set("mes", String(patch.mes))
    }
    router.push(`${pathname}?${q.toString()}`)
  }

  const estilo = {
    backgroundColor: "rgb(var(--card))",
    borderColor: "rgb(var(--border))",
    color: "rgb(var(--foreground))",
  }
  const anoAtual = new Date().getFullYear()
  const anos = [anoAtual + 1, anoAtual, anoAtual - 1]

  return (
    <div className="flex w-full flex-wrap items-center gap-2 text-sm sm:w-auto">
      <select
        aria-label="Mês"
        className="min-w-0 flex-1 rounded-lg border px-3 py-1.5 sm:flex-none"
        style={estilo}
        value={mes ?? ""}
        onChange={(e) => navegar({ mes: e.target.value === "" ? null : Number(e.target.value) })}
      >
        {permitirTodos && <option value="">Todos os meses</option>}
        {MESES_LONGOS.map((nome, i) => (
          <option key={i} value={i + 1}>{nome}</option>
        ))}
      </select>
      <select
        aria-label="Ano"
        className="rounded-lg border px-3 py-1.5"
        style={estilo}
        value={ano}
        onChange={(e) => navegar({ ano: Number(e.target.value) })}
      >
        {anos.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  )
}

export { NOMES_MES }

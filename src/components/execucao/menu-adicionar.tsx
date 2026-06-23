"use client"
import { useState } from "react"
import type { GrupoOrcamento } from "@/lib/types"
import { NovoItem } from "@/components/orcamento/novo-item"
import { NovaCategoria } from "./nova-categoria"

export function MenuAdicionar({ grupos, statusPorMes, mesPadrao }: {
  grupos: GrupoOrcamento[]
  statusPorMes: Record<number, "aberto" | "concluido">
  mesPadrao: number
}) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [modal, setModal] = useState<"item" | "categoria" | null>(null)

  return (
    <div className="relative">
      <button type="button" onClick={() => setMenuAberto((v) => !v)}
        className="rounded-full border border-border bg-card px-4 py-1.5 text-[13px] font-medium hover:bg-faint">
        + Adicionar
      </button>

      {menuAberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)} />
          <div className="absolute left-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card text-sm shadow-lg">
            <button type="button" onClick={() => { setModal("item"); setMenuAberto(false) }}
              className="block w-full px-3 py-2 text-left hover:bg-faint">Item</button>
            <button type="button" onClick={() => { setModal("categoria"); setMenuAberto(false) }}
              className="block w-full px-3 py-2 text-left hover:bg-faint">Categoria</button>
          </div>
        </>
      )}

      <NovoItem
        grupos={grupos}
        endpoint="/api/execucao/item"
        statusPorMes={statusPorMes}
        mesPadrao={mesPadrao}
        aberto={modal === "item"}
        onClose={() => setModal(null)}
      />
      <NovaCategoria grupos={grupos} aberto={modal === "categoria"} onClose={() => setModal(null)} />
    </div>
  )
}

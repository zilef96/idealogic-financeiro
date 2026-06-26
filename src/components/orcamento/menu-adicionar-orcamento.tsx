"use client"
import { useState } from "react"
import { Plus, FileText, FolderPlus } from "lucide-react"
import type { GrupoOrcamento } from "@/lib/types"
import { btn } from "@/components/ui/botao"
import { NovoItem } from "@/components/orcamento/novo-item"
import { NovaCategoria } from "@/components/execucao/nova-categoria"

export function MenuAdicionarOrcamento({ grupos }: { grupos: GrupoOrcamento[] }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [modal, setModal] = useState<"item" | "categoria" | null>(null)

  return (
    <div className="relative">
      <button type="button" onClick={() => setMenuAberto((v) => !v)} className={btn}>
        <Plus size={16} strokeWidth={2} aria-hidden /> Adicionar
      </button>

      {menuAberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)} />
          <div className="absolute left-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card text-sm shadow-lg">
            <button type="button" onClick={() => { setModal("item"); setMenuAberto(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-faint">
              <FileText size={15} strokeWidth={2} aria-hidden /> Item</button>
            <button type="button" onClick={() => { setModal("categoria"); setMenuAberto(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-faint">
              <FolderPlus size={15} strokeWidth={2} aria-hidden /> Categoria</button>
          </div>
        </>
      )}

      <NovoItem grupos={grupos} endpoint="/api/orcamento" mostrarComentarios
        aberto={modal === "item"} onClose={() => setModal(null)} />
      <NovaCategoria grupos={grupos} endpoint="/api/orcamento/grupo"
        aberto={modal === "categoria"} onClose={() => setModal(null)} />
    </div>
  )
}

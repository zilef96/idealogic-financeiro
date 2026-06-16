"use client"
import { useState } from "react"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import type { CategoriaNode } from "@/lib/services/dashboard-service"
import { fmtMoedaTip } from "../formatos"

const COR_TIPO: Record<string, string> = { R: "#16a34a", C: "#ea580c", D: "#dc2626", E: "#7c3aed", "?": "#64748b" }

export function CategoriasChart({ raizes }: { raizes: CategoriaNode[] }) {
  const [caminho, setCaminho] = useState<CategoriaNode[]>([])
  const atual = caminho.at(-1)
  const nivel = atual ? atual.filhos : raizes
  const data = nivel.map((n) => ({ name: n.nome, size: Math.max(n.valor, 0), node: n }))

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm">
        <h3 className="font-semibold">Despesas e Receitas por Categoria</h3>
        <button type="button" className="text-xs underline" onClick={() => setCaminho([])} disabled={caminho.length === 0}>
          início
        </button>
        {caminho.map((n, i) => (
          <span key={n.codigo} className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            / <button type="button" className="underline" onClick={() => setCaminho(caminho.slice(0, i + 1))}>{n.nome}</button>
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <Treemap data={data} dataKey="size" nameKey="name" stroke="#fff"
          content={<Celula onDrill={(node) => node.filhos.length > 0 && setCaminho([...caminho, node])} />}>
          <Tooltip formatter={(v) => fmtMoedaTip(v)} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  )
}

interface CelulaProps { x?: number; y?: number; width?: number; height?: number; name?: string; node?: CategoriaNode; onDrill: (n: CategoriaNode) => void }
function Celula({ x = 0, y = 0, width = 0, height = 0, name, node, onDrill }: CelulaProps) {
  if (!node) return null
  return (
    <g onClick={() => onDrill(node)} style={{ cursor: node.filhos.length ? "pointer" : "default" }}>
      <rect x={x} y={y} width={width} height={height} fill={COR_TIPO[node.tipo]} fillOpacity={0.85} stroke="#fff" />
      {width > 60 && height > 20 && <text x={x + 4} y={y + 16} fontSize={11} fill="#fff">{name}</text>}
    </g>
  )
}

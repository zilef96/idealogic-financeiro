"use client"
import { useState } from "react"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import type { CategoriaNode } from "@/lib/services/dashboard-service"
import { fmtMoedaTip } from "../formatos"
import { ChartTitulo } from "../chart-ui"
import { useChartTheme, tooltipEstilo } from "../use-chart-theme"

const COR_TIPO: Record<string, string> = { R: "#16a34a", C: "#ea580c", D: "#dc2626", E: "#7c3aed", "?": "#64748b" }
const TIPO_ROTULO: { tipo: string; nome: string }[] = [
  { tipo: "R", nome: "Receita" }, { tipo: "C", nome: "Custo" }, { tipo: "D", nome: "Despesa" }, { tipo: "E", nome: "Distribuição" },
]

export function CategoriasChart({ raizes }: { raizes: CategoriaNode[] }) {
  const ct = useChartTheme()
  const [caminho, setCaminho] = useState<CategoriaNode[]>([])
  const atual = caminho.at(-1)
  const nivel = atual ? atual.filhos : raizes
  const data = nivel.map((n) => ({ name: n.nome, size: Math.max(n.valor, 0), node: n }))

  return (
    <div>
      <ChartTitulo titulo="Despesas e Receitas por Categoria" info="Mostra para onde vai (e de onde vem) o dinheiro, por categoria contábil, no acumulado do ano. O tamanho de cada bloco é proporcional ao valor. Clique num bloco para descer um nível; use as setas do caminho para voltar." />
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs" style={{ color: "rgb(var(--muted))" }}>
        <button type="button" className="underline disabled:no-underline disabled:opacity-50" onClick={() => setCaminho([])} disabled={caminho.length === 0}>
          início
        </button>
        {caminho.map((n, i) => (
          <span key={n.codigo}>
            / <button type="button" className="underline" onClick={() => setCaminho(caminho.slice(0, i + 1))}>{n.nome}</button>
          </span>
        ))}
        <span className="ml-auto flex flex-wrap gap-2">
          {TIPO_ROTULO.map((t) => (
            <span key={t.tipo} className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_TIPO[t.tipo] }} />{t.nome}
            </span>
          ))}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <Treemap data={data} dataKey="size" nameKey="name" stroke="#fff"
          content={<Celula onDrill={(node) => node.filhos.length > 0 && setCaminho([...caminho, node])} />}>
          <Tooltip {...tooltipEstilo(ct)} formatter={(v) => fmtMoedaTip(v)} />
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

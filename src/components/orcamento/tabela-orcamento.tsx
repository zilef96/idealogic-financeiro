"use client"
import { useState } from "react"
import type { LinhaOrcamento, GrupoOrcamento } from "@/lib/types"
import { somasPorClassificacao } from "@/lib/services/orcamento-service"

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function TabelaOrcamento({ linhas, grupos }: { linhas: LinhaOrcamento[]; grupos: GrupoOrcamento[] }) {
  const [abertos, setAbertos] = useState<Record<string, boolean>>({})
  const raizes = grupos.filter((g) => g.codigoPai === null)
  const filhosDe = (cod: string) => grupos.filter((g) => g.codigoPai === cod)
  const itensDe = (g: GrupoOrcamento) => linhas.filter((l) => l.grupoCodigo === g.codigo)
  const toggle = (cod: string) => setAbertos((s) => ({ ...s, [cod]: !s[cod] }))

  function Grupo({ g, nivel }: { g: GrupoOrcamento; nivel: number }) {
    const itens = itensDe(g)
    const somas = somasPorClassificacao(itens)
    const ehReceita = g.tipo === "R"
    return (
      <div className="border-b border-border">
        <button onClick={() => toggle(g.codigo)}
          className="flex w-full items-center justify-between py-2 text-left"
          style={{ paddingLeft: `${nivel * 12}px` }}>
          <span className="font-medium">{abertos[g.codigo] ? "▾" : "▸"} {g.nome}</span>
          <span className="text-sm text-muted">
            {ehReceita ? `Contratado ${fmt(somas.C)} · Projetado ${fmt(somas.P)}`
                       : `Essencial ${fmt(somas.E)} · Condicionado ${fmt(somas.S)}`}
          </span>
        </button>
        {abertos[g.codigo] && (
          <div>
            {filhosDe(g.codigo).map((f) => <Grupo key={f.codigo} g={f} nivel={nivel + 1} />)}
            {/* tabela rola horizontal no mobile */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="text-left text-muted">
                  <th className="py-1">Item</th><th>Period.</th><th>Orçado</th><th>Orçado mensal</th><th>Classif.</th>
                </tr></thead>
                <tbody>
                  {itens.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="py-1" style={{ paddingLeft: `${(nivel + 1) * 12}px` }}>{l.nome}</td>
                      <td>{l.periodicidade}</td>
                      <td>{fmt(l.valorOrcado)}</td>
                      <td>{fmt(l.valorOrcadoMensal)}</td>
                      <td>{l.classificacao ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  return <div>{raizes.map((g) => <Grupo key={g.codigo} g={g} nivel={0} />)}</div>
}

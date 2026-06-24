"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { GrupoOrcamento, TipoConta } from "@/lib/types"
import { useToast } from "@/components/ui/toast"
import { blocosDisponiveis, raizDoBloco, filhosDe } from "@/lib/services/cascata-grupos"

const inputCls = "mt-1 w-full rounded border border-border bg-background p-2 text-sm"
const ROTULO_BLOCO: Record<TipoConta, string> = { R: "Receita", C: "Custo", D: "Despesa", E: "Estrutura" }

export function NovaCategoria({ grupos, aberto, onClose, endpoint = "/api/execucao/grupo" }: {
  grupos: GrupoOrcamento[]
  aberto: boolean
  onClose: () => void
  endpoint?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [tipoSel, setTipoSel] = useState<TipoConta | "">("")
  const [caminho, setCaminho] = useState<string[]>([])
  const [nome, setNome] = useState("")

  const blocos = blocosDisponiveis(grupos)
  const raiz = tipoSel ? raizDoBloco(grupos, tipoSel) : undefined

  // Cascata: cada nível mostra os filhos do nó escolhido acima. Aceita parar em qualquer nó.
  const niveis: GrupoOrcamento[][] = []
  let paiCodigo = raiz?.codigo
  for (let d = 0; paiCodigo; d++) {
    const opcoes = filhosDe(grupos, paiCodigo)
    if (opcoes.length === 0) break
    niveis.push(opcoes)
    paiCodigo = caminho[d]
  }

  // Pai = nó mais profundo escolhido; se nenhum, a própria raiz do bloco.
  const paiCodigoEscolhido = caminho.length ? caminho[caminho.length - 1] : raiz?.codigo
  const grupoPai = grupos.find((g) => g.codigo === paiCodigoEscolhido)

  function reset() { setTipoSel(""); setCaminho([]); setNome(""); setErro("") }
  function fechar() { reset(); onClose() }
  function escolherNivel(d: number, codigo: string) {
    setCaminho((c) => (codigo ? [...c.slice(0, d), codigo] : c.slice(0, d)))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!grupoPai) { setErro("Selecione o grupo pai."); return }
    if (!nome.trim()) { setErro("Informe o nome da categoria."); return }
    setSalvando(true)
    const r = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grupoPaiId: grupoPai.id, nome: nome.trim() }),
    })
    setSalvando(false)
    if (r.ok) { fechar(); router.refresh(); toast({ tipo: "sucesso", texto: "Categoria criada." }); return }
    if (r.status === 401 || r.status === 403) setErro("Sem permissão para criar categorias.")
    else if (r.status === 422) setErro("Revise os campos: dados inválidos.")
    else setErro("Não foi possível salvar a categoria.")
  }

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={fechar}>
      <form onSubmit={salvar} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-semibold">Nova categoria</h2>

        <div className="text-sm">
          <span className="block">Bloco</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {blocos.map((t) => (
              <button key={t} type="button" onClick={() => { setTipoSel(t); setCaminho([]) }}
                className={`rounded-full border px-3 py-1 text-[12px] ${tipoSel === t ? "border-foreground font-medium" : "border-border hover:bg-faint"}`}>
                {t} — {ROTULO_BLOCO[t]}
              </button>
            ))}
          </div>
        </div>

        {niveis.map((opcoes, d) => (
          <label key={d} className="block text-sm">{d === 0 ? "Grupo pai" : "Subgrupo pai"}
            <select className={inputCls} value={caminho[d] ?? ""} onChange={(e) => escolherNivel(d, e.target.value)}>
              <option value="">{d === 0 ? "Selecione…" : "— (parar aqui)"}</option>
              {opcoes.map((g) => <option key={g.id} value={g.codigo}>{g.codigo} — {g.nome}</option>)}
            </select>
          </label>
        ))}

        {grupoPai && <p className="text-[12px]" style={{ color: "rgb(var(--muted))" }}>Pai: {grupoPai.codigo} — {grupoPai.nome}</p>}

        <label className="block text-sm">Nome da categoria
          <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Ferramentas" />
        </label>

        {erro && <p className="text-sm" style={{ color: "rgb(var(--danger))" }}>{erro}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={fechar}
            className="rounded border border-border px-3 py-1.5 text-sm hover:bg-faint">Cancelar</button>
          <button type="submit" disabled={salvando}
            className="rounded px-3 py-1.5 text-sm font-medium text-background disabled:opacity-60"
            style={{ background: "rgb(var(--foreground))" }}>
            {salvando ? "Salvando…" : "Criar categoria"}
          </button>
        </div>
      </form>
    </div>
  )
}

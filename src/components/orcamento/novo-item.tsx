"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { GrupoOrcamento, Periodicidade, Classificacao } from "@/lib/types"
import { useToast } from "@/components/ui/toast"

const CLASSIFS: { v: Classificacao; nome: string }[] = [
  { v: "C", nome: "Contratado" },
  { v: "P", nome: "Projetado" },
  { v: "E", nome: "Essencial" },
  { v: "S", nome: "Condicionado" },
]

const inputCls = "mt-1 w-full rounded border border-border bg-background p-2 text-sm"

export function NovoItem({ grupos, endpoint = "/api/orcamento" }: { grupos: GrupoOrcamento[]; endpoint?: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  const [grupoId, setGrupoId] = useState<string>("")
  const [nome, setNome] = useState("")
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("M")
  const [valor, setValor] = useState("")
  const [classificacao, setClassificacao] = useState<Classificacao | "">("")
  const [mesInicio, setMesInicio] = useState("")
  const [mesFim, setMesFim] = useState("")

  const ordenados = [...grupos].sort((a, b) => Number(a.codigo) - Number(b.codigo))

  function reset() {
    setGrupoId(""); setNome(""); setPeriodicidade("M"); setValor("")
    setClassificacao(""); setMesInicio(""); setMesFim(""); setErro("")
  }
  function fechar() { setAberto(false); reset() }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!grupoId) { setErro("Selecione um grupo."); return }
    if (!nome.trim()) { setErro("Informe o nome do item."); return }
    setSalvando(true)
    const body = {
      grupoId: Number(grupoId),
      nome: nome.trim(),
      periodicidade,
      valor: Number(valor) || 0,
      classificacao: classificacao || null,
      mesInicio: periodicidade === "M" && mesInicio ? Number(mesInicio) : null,
      mesFim: periodicidade === "M" && mesFim ? Number(mesFim) : null,
    }
    const r = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })
    setSalvando(false)
    if (r.ok) { fechar(); router.refresh(); toast({ tipo: "sucesso", texto: "Item criado." }) }
    else if (r.status === 401 || r.status === 403) setErro("Sem permissão para criar itens.")
    else setErro("Não foi possível salvar o item.")
  }

  return (
    <>
      <button type="button" onClick={() => setAberto(true)}
        className="rounded-full border border-border bg-card px-4 py-1.5 text-[13px] font-medium hover:bg-faint">
        + Novo item
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={fechar}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-semibold">Novo item de orçamento</h2>

            <label className="block text-sm">Grupo
              <select className={inputCls} value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
                <option value="">Selecione…</option>
                {ordenados.map((g) => (
                  <option key={g.id} value={g.id}>{g.codigo} — {g.nome}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">Nome
              <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Cliente Exemplo — sustentação" />
            </label>

            <div className="flex gap-3">
              <label className="block flex-1 text-sm">Periodicidade
                <select className={inputCls} value={periodicidade}
                  onChange={(e) => setPeriodicidade(e.target.value as Periodicidade)}>
                  <option value="M">Mensal</option>
                  <option value="A">Anual</option>
                </select>
              </label>
              <label className="block flex-1 text-sm">{periodicidade === "M" ? "Valor mensal" : "Valor anual"} (R$)
                <input className={inputCls} type="number" min={0} step="0.01" inputMode="decimal"
                  value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
              </label>
            </div>

            <label className="block text-sm">Classificação
              <select className={inputCls} value={classificacao}
                onChange={(e) => setClassificacao(e.target.value as Classificacao | "")}>
                <option value="">— (sem classificação)</option>
                {CLASSIFS.map((c) => <option key={c.v} value={c.v}>{c.v} — {c.nome}</option>)}
              </select>
            </label>

            {periodicidade === "M" && (
              <div className="flex gap-3">
                <label className="block flex-1 text-sm">Mês início
                  <input className={inputCls} type="number" min={1} max={12}
                    value={mesInicio} onChange={(e) => setMesInicio(e.target.value)} placeholder="1" />
                </label>
                <label className="block flex-1 text-sm">Mês fim
                  <input className={inputCls} type="number" min={1} max={12}
                    value={mesFim} onChange={(e) => setMesFim(e.target.value)} placeholder="12" />
                </label>
              </div>
            )}

            {erro && <p className="text-sm" style={{ color: "rgb(var(--danger))" }}>{erro}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={fechar}
                className="rounded border border-border px-3 py-1.5 text-sm hover:bg-faint">Cancelar</button>
              <button type="submit" disabled={salvando}
                className="rounded px-3 py-1.5 text-sm font-medium text-background disabled:opacity-60"
                style={{ background: "rgb(var(--foreground))" }}>
                {salvando ? "Salvando…" : "Criar item"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { GrupoOrcamento, Periodicidade, Classificacao, TipoConta } from "@/lib/types"
import { useToast } from "@/components/ui/toast"
import { blocosDisponiveis, raizDoBloco, filhosDe, classificacoesDoTipo } from "@/lib/services/cascata-grupos"
import { vigenciaInvalidaPorFechamento } from "@/lib/services/orcamento-service"

const inputCls = "mt-1 w-full rounded border border-border bg-background p-2 text-sm"
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const ROTULO_BLOCO: Record<TipoConta, string> = { R: "Receita", C: "Custo", D: "Despesa", E: "Estrutura" }

type StatusPorMes = Record<number, "aberto" | "concluido">

export type ItemEditar = {
  id: number
  tipo: TipoConta
  grupoCodigo: string
  grupoNome: string
  nome: string
  periodicidade: Periodicidade
  valor: number
  classificacao: Classificacao | null
  mesInicio: number | null
  mesFim: number | null
  comentarios: string | null
}

export function NovoItem({
  grupos, endpoint = "/api/orcamento", statusPorMes, mesPadrao, aberto, onClose, itemEditar,
}: {
  grupos: GrupoOrcamento[]
  endpoint?: string
  statusPorMes?: StatusPorMes
  mesPadrao?: number
  aberto?: boolean
  onClose?: () => void
  itemEditar?: ItemEditar
}) {
  const router = useRouter()
  const { toast } = useToast()
  const editando = itemEditar !== undefined
  const controlado = aberto !== undefined
  const [abertoInterno, setAbertoInterno] = useState(false)
  const estaAberto = controlado ? aberto : abertoInterno

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  // Cascata (só criar): tipo escolhido + caminho de códigos do 1º nível em diante.
  const [tipoSel, setTipoSel] = useState<TipoConta | "">("")
  const [caminho, setCaminho] = useState<string[]>([])

  const [nome, setNome] = useState(itemEditar?.nome ?? "")
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>(itemEditar?.periodicidade ?? "M")
  const [valor, setValor] = useState(itemEditar ? String(itemEditar.valor) : "")
  const [classificacao, setClassificacao] = useState<Classificacao | "">(itemEditar?.classificacao ?? "")
  const [mesInicio, setMesInicio] = useState<string>(
    itemEditar?.mesInicio != null ? String(itemEditar.mesInicio) : (mesPadrao ? String(mesPadrao) : ""),
  )
  const [mesFim, setMesFim] = useState<string>(itemEditar?.mesFim != null ? String(itemEditar.mesFim) : "12")
  const [comentarios, setComentarios] = useState(itemEditar?.comentarios ?? "")

  const blocos = blocosDisponiveis(grupos)
  const mesesAbertos = Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (m) => !statusPorMes || statusPorMes[m] !== "concluido",
  )

  // Níveis visíveis da cascata (só no modo criar).
  const niveis: GrupoOrcamento[][] = []
  if (!editando && tipoSel) {
    const raiz = raizDoBloco(grupos, tipoSel)
    let paiCodigo = raiz?.codigo
    for (let d = 0; paiCodigo; d++) {
      const opcoes = filhosDe(grupos, paiCodigo)
      if (opcoes.length === 0) break
      niveis.push(opcoes)
      paiCodigo = caminho[d]
    }
  }

  // Grupo opcional: alvo = nó mais profundo escolhido; se nenhum, a raiz do bloco.
  const raizTipo = tipoSel ? raizDoBloco(grupos, tipoSel) : undefined
  const grupoAlvo = caminho.length
    ? grupos.find((g) => g.codigo === caminho[caminho.length - 1])
    : raizTipo

  const classifs = editando
    ? classificacoesDoTipo(itemEditar!.tipo)
    : (tipoSel ? classificacoesDoTipo(tipoSel) : [])

  function reset() {
    setTipoSel(""); setCaminho([]); setNome(""); setPeriodicidade("M"); setValor("")
    setClassificacao(""); setMesInicio(mesPadrao ? String(mesPadrao) : ""); setMesFim("12"); setComentarios(""); setErro("")
  }
  function fechar() {
    if (!editando) reset()
    setErro("")
    if (controlado) onClose?.(); else setAbertoInterno(false)
  }
  function escolherTipo(t: TipoConta) { setTipoSel(t); setCaminho([]); setClassificacao("") }
  function escolherNivel(d: number, codigo: string) {
    setCaminho((c) => (codigo ? [...c.slice(0, d), codigo] : c.slice(0, d)))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!editando && !grupoAlvo) { setErro("Selecione ao menos o bloco."); return }
    if (!nome.trim()) { setErro("Informe o nome do item."); return }
    const ini = periodicidade === "M" && mesInicio ? Number(mesInicio) : null
    const fim = periodicidade === "M" && mesFim ? Number(mesFim) : null
    if (statusPorMes && periodicidade === "M" && vigenciaInvalidaPorFechamento("M", ini, fim, statusPorMes)) {
      setErro("Corrija o período: há mês concluído entre início e fim."); return
    }
    setSalvando(true)
    const comum = {
      nome: nome.trim(), periodicidade, valor: Number(valor) || 0,
      classificacao: classificacao || null, mesInicio: ini, mesFim: fim,
      comentarios: comentarios.trim() || null,
    }
    const url = editando ? `${endpoint}/${itemEditar!.id}` : endpoint
    const metodo = editando ? "PATCH" : "POST"
    const body = editando ? comum : { grupoId: grupoAlvo!.id, ...comum }
    const r = await fetch(url, {
      method: metodo, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })
    setSalvando(false)
    if (r.ok) {
      fechar(); router.refresh()
      toast({ tipo: "sucesso", texto: editando ? "Item atualizado." : "Item criado." }); return
    }
    if (r.status === 409) setErro("Período inclui mês concluído; ajuste a vigência.")
    else if (r.status === 401 || r.status === 403) setErro("Sem permissão para editar itens.")
    else if (r.status === 422) setErro("Revise os campos: dados inválidos.")
    else setErro("Não foi possível salvar o item.")
  }

  return (
    <>
      {!controlado && (
        <button type="button" onClick={() => setAbertoInterno(true)}
          className="rounded-full border border-border bg-card px-4 py-1.5 text-[13px] font-medium hover:bg-faint">
          + Novo item
        </button>
      )}

      {estaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={fechar}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-semibold">
              {editando ? "Editar item" : "Novo item de orçamento"}
            </h2>

            {editando ? (
              <p className="text-[12px]" style={{ color: "rgb(var(--muted))" }}>
                Grupo: {itemEditar!.grupoCodigo} — {itemEditar!.grupoNome}
              </p>
            ) : (
              <>
                <div className="text-sm">
                  <span className="block">Bloco</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {blocos.map((t) => (
                      <button key={t} type="button" onClick={() => escolherTipo(t)}
                        className={`rounded-full border px-3 py-1 text-[12px] ${tipoSel === t ? "border-foreground font-medium" : "border-border hover:bg-faint"}`}>
                        {t} — {ROTULO_BLOCO[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {niveis.map((opcoes, d) => (
                  <label key={d} className="block text-sm">{d === 0 ? "Grupo (opcional)" : "Subgrupo (opcional)"}
                    <select className={inputCls} value={caminho[d] ?? ""} onChange={(e) => escolherNivel(d, e.target.value)}>
                      <option value="">{d === 0 ? "— (direto no bloco)" : "— (parar aqui)"}</option>
                      {opcoes.map((g) => <option key={g.id} value={g.codigo}>{g.codigo} — {g.nome}</option>)}
                    </select>
                  </label>
                ))}

                {grupoAlvo && (
                  <p className="text-[12px]" style={{ color: "rgb(var(--muted))" }}>
                    Será criado em: {grupoAlvo.codigo} — {grupoAlvo.nome}
                  </p>
                )}
              </>
            )}

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
                {classifs.map((c) => <option key={c.v} value={c.v}>{c.v} — {c.nome}</option>)}
              </select>
            </label>

            <label className="block text-sm">Comentários (opcional)
              <textarea className={inputCls} rows={2} value={comentarios}
                onChange={(e) => setComentarios(e.target.value)} placeholder="Observações do item…" />
            </label>

            {periodicidade === "M" && (
              <div className="flex gap-3">
                <label className="block flex-1 text-sm">Mês início
                  <select className={inputCls} value={mesInicio} onChange={(e) => setMesInicio(e.target.value)}>
                    <option value="">Selecione…</option>
                    {mesesAbertos.map((m) => <option key={m} value={m}>{MESES[m - 1]}</option>)}
                  </select>
                </label>
                <label className="block flex-1 text-sm">Mês fim
                  <select className={inputCls} value={mesFim} onChange={(e) => setMesFim(e.target.value)}>
                    <option value="">Selecione…</option>
                    {mesesAbertos.map((m) => <option key={m} value={m}>{MESES[m - 1]}</option>)}
                  </select>
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
                {salvando ? "Salvando…" : editando ? "Salvar" : "Criar item"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

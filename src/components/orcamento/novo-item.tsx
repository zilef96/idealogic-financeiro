"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { GrupoOrcamento, Periodicidade, Classificacao, TipoConta } from "@/lib/types"
import { useToast } from "@/components/ui/toast"
import { blocosDisponiveis, raizDoBloco, filhosDe, ehFolha, classificacoesDoTipo } from "@/lib/services/cascata-grupos"
import { vigenciaInvalidaPorFechamento } from "@/lib/services/orcamento-service"

const inputCls = "mt-1 w-full rounded border border-border bg-background p-2 text-sm"
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const ROTULO_BLOCO: Record<TipoConta, string> = { R: "Receita", C: "Custo", D: "Despesa", E: "Estrutura" }

type StatusPorMes = Record<number, "aberto" | "concluido">

export function NovoItem({
  grupos,
  endpoint = "/api/orcamento",
  statusPorMes,
  mesPadrao,
  aberto,
  onClose,
}: {
  grupos: GrupoOrcamento[]
  endpoint?: string
  statusPorMes?: StatusPorMes
  mesPadrao?: number
  aberto?: boolean
  onClose?: () => void
}) {
  const router = useRouter()
  const { toast } = useToast()
  const controlado = aberto !== undefined
  const [abertoInterno, setAbertoInterno] = useState(false)
  const estaAberto = controlado ? aberto : abertoInterno

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  // Cascata: tipo escolhido + caminho de códigos selecionados (do 1º nível até a folha).
  const [tipoSel, setTipoSel] = useState<TipoConta | "">("")
  const [caminho, setCaminho] = useState<string[]>([])

  const [nome, setNome] = useState("")
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("M")
  const [valor, setValor] = useState("")
  const [classificacao, setClassificacao] = useState<Classificacao | "">("")
  const [mesInicio, setMesInicio] = useState<string>(mesPadrao ? String(mesPadrao) : "")
  const [mesFim, setMesFim] = useState<string>("12")

  const blocos = blocosDisponiveis(grupos)
  const mesesAbertos = Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (m) => !statusPorMes || statusPorMes[m] !== "concluido",
  )

  // Monta os níveis visíveis da cascata: cada nível mostra os filhos do nó escolhido acima.
  const niveis: GrupoOrcamento[][] = []
  if (tipoSel) {
    const raiz = raizDoBloco(grupos, tipoSel)
    let paiCodigo = raiz?.codigo
    for (let d = 0; paiCodigo; d++) {
      const opcoes = filhosDe(grupos, paiCodigo)
      if (opcoes.length === 0) break
      niveis.push(opcoes)
      paiCodigo = caminho[d] // próximo nível só com o anterior escolhido
    }
  }

  const grupoSelecionado = caminho.length
    ? grupos.find((g) => g.codigo === caminho[caminho.length - 1])
    : undefined
  const folhaResolvida = grupoSelecionado && ehFolha(grupos, grupoSelecionado) ? grupoSelecionado : undefined

  function reset() {
    setTipoSel(""); setCaminho([]); setNome(""); setPeriodicidade("M"); setValor("")
    setClassificacao(""); setMesInicio(mesPadrao ? String(mesPadrao) : ""); setMesFim("12"); setErro("")
  }
  function fechar() {
    reset()
    if (controlado) onClose?.(); else setAbertoInterno(false)
  }
  function escolherTipo(t: TipoConta) {
    setTipoSel(t); setCaminho([]); setClassificacao("")
  }
  function escolherNivel(d: number, codigo: string) {
    setCaminho((c) => (codigo ? [...c.slice(0, d), codigo] : c.slice(0, d)))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!folhaResolvida) { setErro("Selecione o grupo até o nível final."); return }
    if (!nome.trim()) { setErro("Informe o nome do item."); return }
    const ini = periodicidade === "M" && mesInicio ? Number(mesInicio) : null
    const fim = periodicidade === "M" && mesFim ? Number(mesFim) : null
    // Validação de vigência no cliente (só Execução, periodicidade M). Servidor mantém o 409 como rede de segurança.
    if (statusPorMes && periodicidade === "M" && vigenciaInvalidaPorFechamento("M", ini, fim, statusPorMes)) {
      setErro("Corrija o período: há mês concluído entre início e fim."); return
    }
    setSalvando(true)
    const body = {
      grupoId: folhaResolvida.id,
      nome: nome.trim(),
      periodicidade,
      valor: Number(valor) || 0,
      classificacao: classificacao || null,
      mesInicio: ini,
      mesFim: fim,
    }
    const r = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })
    setSalvando(false)
    if (r.ok) { fechar(); router.refresh(); toast({ tipo: "sucesso", texto: "Item criado." }); return }
    if (r.status === 409) setErro("Período inclui mês concluído; ajuste a vigência.")
    else if (r.status === 401 || r.status === 403) setErro("Sem permissão para criar itens.")
    else if (r.status === 422) setErro("Revise os campos: dados inválidos.")
    else setErro("Não foi possível salvar o item.")
  }

  const classifs = tipoSel ? classificacoesDoTipo(tipoSel) : []

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
            <h2 className="font-display text-base font-semibold">Novo item de orçamento</h2>

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
              <label key={d} className="block text-sm">{d === 0 ? "Grupo" : "Subgrupo"}
                <select className={inputCls} value={caminho[d] ?? ""} onChange={(e) => escolherNivel(d, e.target.value)}>
                  <option value="">Selecione…</option>
                  {opcoes.map((g) => <option key={g.id} value={g.codigo}>{g.codigo} — {g.nome}</option>)}
                </select>
              </label>
            ))}

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
                {salvando ? "Salvando…" : "Criar item"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

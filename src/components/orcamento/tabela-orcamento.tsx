"use client"
import { useState, type ReactNode } from "react"
import type { LinhaOrcamento, GrupoOrcamento, Classificacao } from "@/lib/types"
import { rollupGrupo, ehEssencial } from "@/lib/services/orcamento-service"
import { AlteracoesNaoSalvasProvider, useAlteracoesNaoSalvas } from "@/components/execucao/alteracoes-nao-salvas"
import { Lock, LockOpen, Pencil, Trash2, ChevronsUpDown, ChevronsDownUp } from "lucide-react"
import { btn, btnGhost } from "@/components/ui/botao"
import { CampoValorOrcado } from "./campo-valor-orcado"
import { EditarCategoria } from "./editar-categoria"
import { ConfirmarExclusao } from "./confirmar-exclusao"
import { MenuAdicionarOrcamento } from "./menu-adicionar-orcamento"
import { NovoItem, type ItemEditar } from "./novo-item"

const brl = (n: number) => (n === 0 ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const brlK = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR")

const ACC: Record<string, string> = { R: "--pos", C: "--rose", D: "--info", E: "--amber" }
const TINT: Record<string, string> = { R: "--pos-soft", C: "--rose-soft", D: "--info-soft", E: "--amber-soft" }
const accRgb = (t: string) => `rgb(var(${ACC[t] ?? "--muted"}))`
const tintRgb = (t: string) => `rgb(var(${TINT[t] ?? "--faint"}))`
const TIPO_LABEL: Record<string, string> = { R: "Receita", C: "Custo", D: "Despesa", E: "Dividendos" }
// Rótulos do desdobramento por bloco: Receita = Contratado/Projetado; demais = Essencial/Condicionado.
const rotuloEssCond = (tipo: string): [string, string] =>
  tipo === "R" ? ["Contratado", "Projetado"] : ["Essencial", "Condicionado"]
const NOME_CLASSIF: Record<Classificacao, string> = { C: "Contratado", P: "Projetado", E: "Essencial", S: "Condicionado" }

function Chevron({ aberto, cor }: { aberto: boolean; cor: string }) {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 transition-transform duration-200" style={{ color: cor, transform: aberto ? "rotate(90deg)" : "none" }}
      fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function BadgePer({ p }: { p: "M" | "A" }) {
  return (
    <span className="num inline-grid h-4 w-4 place-items-center rounded text-[10px] font-semibold"
      style={{ color: "rgb(var(--muted))", background: "rgb(var(--faint))" }} title={p === "M" ? "Mensal" : "Anual"}>{p}</span>
  )
}

function BadgeClassif({ c }: { c: Classificacao }) {
  const ess = ehEssencial(c)
  const cor = ess ? "var(--pos)" : "var(--amber)"
  const soft = ess ? "var(--pos-soft)" : "var(--amber-soft)"
  return (
    <span className="num inline-grid h-4 w-4 place-items-center rounded text-[10px] font-semibold"
      style={{ color: `rgb(${cor})`, background: `rgb(${soft})` }} title={NOME_CLASSIF[c]}>{c}</span>
  )
}

// Chip de classificação com o nome por extenso (Contratado/Projetado em Receita; Essencial/Condicionado nos demais). Usado no mobile.
function ChipClassif({ c }: { c: Classificacao }) {
  const ess = ehEssencial(c)
  const cor = ess ? "var(--pos)" : "var(--amber)"
  const soft = ess ? "var(--pos-soft)" : "var(--amber-soft)"
  return (
    <span className="shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium"
      style={{ color: `rgb(${cor})`, background: `rgb(${soft})` }}>{NOME_CLASSIF[c]}</span>
  )
}

function Cel({ v, cor, cls }: { v: number; cor: string; cls?: string }) {
  return <div className={`orc-tot num text-[13px] ${cls ?? ""}`} style={{ color: v === 0 ? "rgb(var(--muted) / 0.5)" : cor }}>{brl(v)}</div>
}

function BotaoCadeado({ editando, onToggle }: { editando: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className={btn}>
      {editando
        ? <><LockOpen size={16} strokeWidth={2} aria-hidden /> Em edição</>
        : <><Lock size={16} strokeWidth={2} aria-hidden /> Somente leitura</>}
    </button>
  )
}

// Célula de ações (editar/excluir) ao fim da linha. No desktop revela no hover; no toque fica sempre visível (.acoes-linha).
function AcoesLinha({ onEditar, onExcluir }: { onEditar: () => void; onExcluir: () => void }) {
  return (
    <div className="acoes-linha orc-col-acoes flex shrink-0 items-center justify-end gap-2 sm:gap-0.5">
      <button type="button" title="Editar" onClick={(e) => { e.stopPropagation(); onEditar() }}
        className="rounded p-2.5 text-[color:rgb(var(--muted))] hover:bg-faint hover:text-foreground sm:p-1.5">
        <Pencil size={15} strokeWidth={2} aria-hidden /></button>
      <button type="button" title="Excluir" onClick={(e) => { e.stopPropagation(); onExcluir() }}
        className="rounded p-2.5 text-[color:rgb(var(--muted))] hover:bg-[color:rgb(var(--rose-soft))] hover:text-[color:rgb(var(--rose))] sm:p-1.5">
        <Trash2 size={15} strokeWidth={2} aria-hidden /></button>
    </div>
  )
}

export function TabelaOrcamento(props: { linhas: LinhaOrcamento[]; grupos: GrupoOrcamento[]; rascunho: boolean }) {
  return (
    <AlteracoesNaoSalvasProvider>
      <TabelaOrcamentoInterno {...props} />
    </AlteracoesNaoSalvasProvider>
  )
}

type AlvoExcluir = { tipo: "item" | "grupo"; id: number; nome: string }

function TabelaOrcamentoInterno({ linhas, grupos, rascunho }: { linhas: LinhaOrcamento[]; grupos: GrupoOrcamento[]; rascunho: boolean }) {
  const raizes = grupos.filter((g) => g.codigoPai === null)
  const [abertos, setAbertos] = useState<Set<string>>(() => new Set<string>())
  const [tudo, setTudo] = useState(false)
  const [editando, setEditando] = useState(false)
  const { confirmarSeHaAlteracoes } = useAlteracoesNaoSalvas()

  // Modais
  const [itemEdit, setItemEdit] = useState<ItemEditar | null>(null)
  const [grupoEdit, setGrupoEdit] = useState<{ id: number; nome: string } | null>(null)
  const [excluir, setExcluir] = useState<AlvoExcluir | null>(null)

  const podeEditarValores = rascunho && editando
  const alternarCadeado = () => {
    if (editando && !confirmarSeHaAlteracoes("Há alterações não salvas. Deseja bloquear a edição e descartá-las?")) return
    setEditando((v) => !v)
  }

  const aberto = (cod: string) => abertos.has(cod)
  const toggle = (cod: string) =>
    setAbertos((s) => {
      const n = new Set(s)
      if (n.has(cod)) n.delete(cod); else n.add(cod)
      return n
    })
  const toggleTudo = () => {
    if (tudo) { setAbertos(new Set()); setTudo(false) }
    else { setAbertos(new Set(grupos.map((g) => g.codigo))); setTudo(true) }
  }

  const filhosDe = (cod: string) => grupos.filter((g) => g.codigoPai === cod)
  const itensDe = (cod: string) => linhas.filter((l) => l.grupoCodigo === cod)
  const tipoDoGrupo = (cod: string) => grupos.find((g) => g.codigo === cod)?.tipo ?? "D"
  const nomeDoGrupo = (cod: string) => grupos.find((g) => g.codigo === cod)?.nome ?? ""

  const totalMensalDe = (tipo: string) => {
    const raiz = raizes.find((g) => g.tipo === tipo)
    return raiz ? rollupGrupo(raiz.codigo, grupos, linhas).mensal : 0
  }
  const receita = totalMensalDe("R"), custos = totalMensalDe("C"), despesas = totalMensalDe("D")
  const resultado = receita - custos - despesas
  const kpis = [
    { label: "Receita projetada", val: receita, cor: "var(--pos)", sub: "Faturamento total" },
    { label: "Custos totais", val: custos, cor: "var(--rose)", sub: "Pessoas + encargos" },
    { label: "Despesas totais", val: despesas, cor: "var(--info)", sub: "Operação + estrutura" },
    { label: "Resultado", val: resultado, cor: resultado < 0 ? "var(--rose)" : "var(--pos)", sub: receita ? `Margem ${((resultado / receita) * 100).toFixed(1)}%` : "—" },
  ]

  function abrirEdicaoItem(it: LinhaOrcamento) {
    setItemEdit({
      id: it.id, tipo: tipoDoGrupo(it.grupoCodigo), grupoCodigo: it.grupoCodigo, grupoNome: nomeDoGrupo(it.grupoCodigo),
      nome: it.nome, periodicidade: it.periodicidade, valor: it.valorOrcado,
      classificacao: it.classificacao, mesInicio: it.mesInicio, mesFim: it.mesFim, comentarios: it.comentarios,
    })
  }

  async function confirmarExclusao(): Promise<string | null> {
    if (!excluir) return null
    const url = excluir.tipo === "item" ? `/api/orcamento/${excluir.id}` : `/api/grupos/${excluir.id}`
    const r = await fetch(url, { method: "DELETE" })
    if (r.ok) { window.location.reload(); return null }
    if (r.status === 409) {
      const corpo = await r.json().catch(() => null)
      return excluir.tipo === "grupo"
        ? "Remova os itens e subgrupos antes de excluir a categoria."
        : (typeof corpo?.error === "string" ? corpo.error : "Não foi possível excluir.")
    }
    if (r.status === 401 || r.status === 403) return "Você não tem permissão para esta ação."
    return "Não foi possível excluir."
  }

  function renderGrupo(g: GrupoOrcamento, nivel: number): ReactNode {
    const r = rollupGrupo(g.codigo, grupos, linhas)
    const filhos = filhosDe(g.codigo)
    const itens = itensDe(g.codigo)
    const expansivel = filhos.length > 0 || itens.length > 0
    const pad = 14 + nivel * 18
    return (
      <div key={g.codigo} className="border-t" style={{ borderColor: "rgb(var(--border))" }}>
        {/* grupo — grade (desktop) */}
        <div className="group orc-row w-full bg-faint text-left transition-colors">
          <button type="button" onClick={() => expansivel && toggle(g.codigo)}
            className="flex items-center gap-2 py-2.5 pr-3 text-[13px] font-semibold" style={{ paddingLeft: pad }}>
            {expansivel
              ? <Chevron aberto={aberto(g.codigo)} cor="rgb(var(--muted))" />
              : <span className="inline-block h-3.5 w-3.5 shrink-0" />}
            <span className="num text-[11px]" style={{ color: "rgb(var(--muted) / 0.8)" }}>{g.codigo}</span>
            <span className="truncate">{g.nome}</span>
          </button>
          <div className="orc-tot" />
          <div className="orc-tot num text-[13px] font-semibold" style={{ color: accRgb(g.tipo) }}>{brl(r.mensal)}</div>
          <Cel v={r.essMensal} cor="rgb(var(--pos))" cls="orc-col-ess" />
          <Cel v={r.condMensal} cor="rgb(var(--amber))" cls="orc-col-cond" />
          <div className="orc-col-com" />
          {rascunho
            ? <AcoesLinha onEditar={() => setGrupoEdit({ id: g.id, nome: g.nome })} onExcluir={() => setExcluir({ tipo: "grupo", id: g.id, nome: g.nome })} />
            : <div className="orc-col-acoes" />}
        </div>
        {/* grupo — lista (mobile) */}
        <div className="group orc-mobile-row flex-col bg-faint" style={{ paddingLeft: 10 + nivel * 14, paddingRight: 8 }}>
          <div className="flex w-full items-center gap-2">
            <button type="button" onClick={() => expansivel && toggle(g.codigo)}
              className="flex min-w-0 flex-1 items-center gap-2 py-2.5 text-left text-[13px] font-semibold">
              {expansivel
                ? <Chevron aberto={aberto(g.codigo)} cor="rgb(var(--muted))" />
                : <span className="inline-block h-3.5 w-3.5 shrink-0" />}
              <span className="num shrink-0 text-[11px]" style={{ color: "rgb(var(--muted) / 0.8)" }}>{g.codigo}</span>
              <span className="line-clamp-2">{g.nome}</span>
            </button>
            <span className="num shrink-0 text-[13px] font-semibold" style={{ color: accRgb(g.tipo) }}>{brl(r.mensal)}</span>
            {rascunho && <AcoesLinha onEditar={() => setGrupoEdit({ id: g.id, nome: g.nome })} onExcluir={() => setExcluir({ tipo: "grupo", id: g.id, nome: g.nome })} />}
          </div>
          {(r.essMensal > 0 || r.condMensal > 0) && (() => {
            const [rotEss, rotCond] = rotuloEssCond(g.tipo)
            return (
              <div className="num flex flex-wrap gap-x-3 gap-y-0.5 pb-2 pl-6 text-[11px]">
                <span style={{ color: "rgb(var(--pos))" }}>{rotEss} {brl(r.essMensal)}</span>
                <span style={{ color: "rgb(var(--amber))" }}>{rotCond} {brl(r.condMensal)}</span>
              </div>
            )
          })()}
        </div>
        {aberto(g.codigo) && (
          <div>
            {filhos.map((f) => renderGrupo(f, nivel + 1))}
            {itens.map((it) => {
              const ess = ehEssencial(it.classificacao)
              return (
                <div key={it.id}>
                  {/* item — grade (desktop) */}
                  <div className="group orc-row border-t text-[13px] hover:bg-faint" style={{ borderColor: "rgb(var(--border) / 0.5)" }}>
                    <span className="flex items-center gap-2 py-2 pr-3" style={{ paddingLeft: pad + 30 }}>
                      <BadgePer p={it.periodicidade} />
                      {it.classificacao && <BadgeClassif c={it.classificacao} />}
                      <span className="truncate">{it.nome}</span>
                    </span>
                    <div className="orc-tot num">
                      {podeEditarValores
                        ? <CampoValorOrcado itemId={it.id} valorInicial={it.valorOrcado} />
                        : brl(it.valorOrcado)}
                    </div>
                    <div className="orc-tot num" style={{ color: "rgb(var(--muted))" }}>{brl(it.valorOrcadoMensal)}</div>
                    <Cel v={ess ? it.valorOrcadoMensal : 0} cor="rgb(var(--pos))" cls="orc-col-ess" />
                    <Cel v={ess ? 0 : it.valorOrcadoMensal} cor="rgb(var(--amber))" cls="orc-col-cond" />
                    <div className="orc-col-com truncate pl-2 text-[12px] italic" style={{ color: "rgb(var(--muted))" }}>{it.comentarios ?? ""}</div>
                    {rascunho
                      ? <AcoesLinha onEditar={() => abrirEdicaoItem(it)} onExcluir={() => setExcluir({ tipo: "item", id: it.id, nome: it.nome })} />
                      : <div className="orc-col-acoes" />}
                  </div>
                  {/* item — lista (mobile) */}
                  <div className="group orc-mobile-row flex-col gap-1.5 border-t py-2.5 pl-3 pr-2"
                    style={{ borderColor: "rgb(var(--border) / 0.5)", borderLeft: `3px solid ${accRgb(g.tipo)}` }}>
                    <div className="flex items-start gap-2">
                      <span className="line-clamp-2 flex-1 text-[13px]">{it.nome}</span>
                      {rascunho && <AcoesLinha onEditar={() => abrirEdicaoItem(it)} onExcluir={() => setExcluir({ tipo: "item", id: it.id, nome: it.nome })} />}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pl-0.5">
                      <div className="num flex items-baseline gap-2">
                        {podeEditarValores ? (
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: "rgb(var(--muted))" }}>
                            {it.periodicidade === "A" ? "Anual" : "Mensal"}
                            <CampoValorOrcado itemId={it.id} valorInicial={it.valorOrcado} />
                          </span>
                        ) : (
                          <>
                            <span className="text-[15px] font-semibold" style={{ color: "rgb(var(--foreground))" }}>
                              {brl(it.valorOrcadoMensal)}<span className="text-[11px]" style={{ color: "rgb(var(--muted))" }}> /mês</span>
                            </span>
                            {it.periodicidade === "A" && (
                              <span className="text-[11px]" style={{ color: "rgb(var(--muted))" }}>anual {brl(it.valorOrcado)}</span>
                            )}
                          </>
                        )}
                      </div>
                      {it.classificacao && <ChipClassif c={it.classificacao} />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-7 sm:gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-3 sm:rounded-2xl sm:p-4">
            <div className="text-[10px] uppercase tracking-wider sm:text-[11px]" style={{ color: "rgb(var(--muted))" }}>{k.label}</div>
            <div className="num font-display mt-1 text-[18px] font-semibold sm:mt-1.5 sm:text-[22px]" style={{ color: `rgb(${k.cor})` }}>
              {brlK(k.val)}<span className="ml-1 text-[11px] font-normal sm:text-[12px]" style={{ color: "rgb(var(--muted))" }}>/mês</span>
            </div>
            <div className="mt-1 text-[11px] sm:text-[12px]" style={{ color: "rgb(var(--muted))" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-[15px] font-semibold">Plano de contas</h2>
        <div className="flex flex-wrap items-center gap-2">
          {rascunho && <BotaoCadeado editando={editando} onToggle={alternarCadeado} />}
          {rascunho && <MenuAdicionarOrcamento grupos={grupos} />}
          <button type="button" onClick={toggleTudo} className={btnGhost}
            title={tudo ? "Recolher tudo" : "Expandir tudo"} aria-label={tudo ? "Recolher tudo" : "Expandir tudo"}>
            {tudo
              ? <><ChevronsDownUp size={16} strokeWidth={2} aria-hidden /> <span className="hidden sm:inline">Recolher tudo</span></>
              : <><ChevronsUpDown size={16} strokeWidth={2} aria-hidden /> <span className="hidden sm:inline">Expandir tudo</span></>}
          </button>
        </div>
      </div>

      {/* tabela só em telas largas (>900px); abaixo disso vira lista. overflow-x protege larguras de borda */}
      <div className="overflow-x-auto">
        <div>
          {/* legenda de colunas */}
          <div className="orc-row rounded-t-xl border border-border bg-card px-5 py-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "rgb(var(--muted))" }}>
            <div>Conta</div>
            <div className="orc-tot">Orçado</div>
            <div className="orc-tot">Orçado mensal</div>
            <div className="orc-tot orc-col-ess" style={{ color: "rgb(var(--pos))" }}>Essencial</div>
            <div className="orc-tot orc-col-cond" style={{ color: "rgb(var(--amber))" }}>Condicionado</div>
            <div className="orc-col-com pl-2">Comentários</div>
            <div className="orc-col-acoes" />
          </div>

          {/* blocos raiz = cartões */}
          <div className="space-y-4 pt-4">
            {raizes.map((b) => {
          const r = rollupGrupo(b.codigo, grupos, linhas)
          const filhos = filhosDe(b.codigo)
          return (
            <div key={b.codigo} className="overflow-hidden rounded-xl border border-border bg-card sm:rounded-2xl">
              <button type="button" onClick={() => toggle(b.codigo)} className="orc-row w-full text-left" style={{ background: tintRgb(b.tipo) }}>
                <span className="flex items-center gap-3 px-5 py-4">
                  <Chevron aberto={aberto(b.codigo)} cor={accRgb(b.tipo)} />
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-sm font-bold bg-card" style={{ color: accRgb(b.tipo) }}>{b.nome[0]}</span>
                  <span className="min-w-0">
                    <span className="font-display block truncate text-[15px] font-semibold">{b.nome}</span>
                    <span className="num block text-[11px]" style={{ color: "rgb(var(--muted))" }}>{b.codigo} · {TIPO_LABEL[b.tipo]} · {filhos.length} grupos</span>
                  </span>
                </span>
                <div className="orc-tot" />
                <div className="orc-tot num font-display text-[15px] font-semibold sm:text-[17px]" style={{ color: accRgb(b.tipo) }}>{brl(r.mensal)}</div>
                <div className="orc-tot orc-col-ess num text-[13px] font-semibold" style={{ color: "rgb(var(--pos))" }}>{brl(r.essMensal)}</div>
                <div className="orc-tot orc-col-cond num text-[13px] font-semibold" style={{ color: "rgb(var(--amber))" }}>{brl(r.condMensal)}</div>
                <div className="orc-col-com" />
                <div className="orc-col-acoes" />
              </button>
              {/* bloco — lista (mobile) */}
              <div className="orc-mobile-row flex-col" style={{ background: tintRgb(b.tipo) }}>
                <button type="button" onClick={() => toggle(b.codigo)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <Chevron aberto={aberto(b.codigo)} cor={accRgb(b.tipo)} />
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-sm font-bold bg-card" style={{ color: accRgb(b.tipo) }}>{b.nome[0]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-display block truncate text-[15px] font-semibold">{b.nome}</span>
                    <span className="num block text-[11px]" style={{ color: "rgb(var(--muted))" }}>{b.codigo} · {TIPO_LABEL[b.tipo]} · {filhos.length} grupos</span>
                  </span>
                  <span className="num font-display shrink-0 text-[15px] font-semibold" style={{ color: accRgb(b.tipo) }}>{brl(r.mensal)}</span>
                </button>
                {(r.essMensal > 0 || r.condMensal > 0) && (() => {
                  const [rotEss, rotCond] = rotuloEssCond(b.tipo)
                  return (
                    <div className="num flex flex-wrap gap-x-4 gap-y-0.5 px-4 pb-2.5 pl-[3.75rem] text-[11px]">
                      <span style={{ color: "rgb(var(--pos))" }}>{rotEss} {brl(r.essMensal)}</span>
                      <span style={{ color: "rgb(var(--amber))" }}>{rotCond} {brl(r.condMensal)}</span>
                    </div>
                  )
                })()}
              </div>
              {aberto(b.codigo) && <div>{filhos.map((f) => renderGrupo(f, 0))}</div>}
            </div>
          )
        })}
          </div>
        </div>
      </div>

      {/* Modais */}
      {itemEdit && (
        <NovoItem grupos={grupos} endpoint="/api/orcamento" itemEditar={itemEdit} mostrarComentarios
          aberto={true} onClose={() => setItemEdit(null)} />
      )}
      {grupoEdit && (
        <EditarCategoria grupo={grupoEdit} aberto={true} onClose={() => setGrupoEdit(null)} />
      )}
      <ConfirmarExclusao
        aberto={excluir !== null}
        titulo={excluir?.tipo === "grupo" ? "Excluir categoria" : "Excluir item"}
        descricao={`Excluir "${excluir?.nome ?? ""}"? Esta ação não pode ser desfeita.`}
        onConfirmar={confirmarExclusao}
        onClose={() => setExcluir(null)}
      />
    </div>
  )
}

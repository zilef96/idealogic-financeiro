"use client"
import { useState, type ReactNode } from "react"
import type { LinhaOrcamento, GrupoOrcamento, Classificacao } from "@/lib/types"
import { rollupGrupo, ehEssencial } from "@/lib/services/orcamento-service"
import { NovoItem } from "@/components/orcamento/novo-item"

const brl = (n: number) => (n === 0 ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const brlK = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR")

const ACC: Record<string, string> = { R: "--pos", C: "--rose", D: "--info", E: "--amber" }
const TINT: Record<string, string> = { R: "--pos-soft", C: "--rose-soft", D: "--info-soft", E: "--amber-soft" }
const accRgb = (t: string) => `rgb(var(${ACC[t] ?? "--muted"}))`
const tintRgb = (t: string) => `rgb(var(${TINT[t] ?? "--faint"}))`
const TIPO_LABEL: Record<string, string> = { R: "Receita", C: "Custo", D: "Despesa", E: "Distribuição" }
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

function Cel({ v, cor }: { v: number; cor: string }) {
  return <div className="orc-tot num text-[13px]" style={{ color: v === 0 ? "rgb(var(--muted) / 0.5)" : cor }}>{brl(v)}</div>
}

export function TabelaOrcamento({ linhas, grupos }: { linhas: LinhaOrcamento[]; grupos: GrupoOrcamento[] }) {
  const raizes = grupos.filter((g) => g.codigoPai === null)
  const [abertos, setAbertos] = useState<Set<string>>(() => new Set(raizes[0] ? [raizes[0].codigo] : []))
  const [tudo, setTudo] = useState(false)

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
    { label: "Resultado", val: resultado, cor: "var(--pos)", sub: receita ? `Margem ${((resultado / receita) * 100).toFixed(1)}%` : "—" },
  ]

  function renderGrupo(g: GrupoOrcamento, nivel: number): ReactNode {
    const r = rollupGrupo(g.codigo, grupos, linhas)
    const filhos = filhosDe(g.codigo)
    const itens = itensDe(g.codigo)
    const expansivel = filhos.length > 0 || itens.length > 0
    const pad = 14 + nivel * 18
    return (
      <div key={g.codigo} className="border-t" style={{ borderColor: "rgb(var(--border))" }}>
        <button type="button" onClick={() => expansivel && toggle(g.codigo)}
          className="orc-row w-full text-left transition-colors hover:bg-faint">
          <span className="flex items-center gap-2 py-2.5 pr-3 text-[13px] font-medium" style={{ paddingLeft: pad }}>
            {expansivel
              ? <Chevron aberto={aberto(g.codigo)} cor="rgb(var(--muted))" />
              : <span className="inline-block h-3.5 w-3.5 shrink-0" />}
            <span className="num text-[11px]" style={{ color: "rgb(var(--muted) / 0.8)" }}>{g.codigo}</span>
            <span className="truncate">{g.nome}</span>
          </span>
          <div className="orc-tot" />
          <div className="orc-tot num text-[13px] font-semibold" style={{ color: accRgb(g.tipo) }}>{brl(r.mensal)}</div>
          <Cel v={r.essMensal} cor="rgb(var(--pos))" />
          <Cel v={r.condMensal} cor="rgb(var(--amber))" />
          <div className="orc-col-com" />
        </button>
        {aberto(g.codigo) && (
          <div>
            {filhos.map((f) => renderGrupo(f, nivel + 1))}
            {itens.map((it) => {
              const ess = ehEssencial(it.classificacao)
              return (
                <div key={it.id} className="orc-row border-t text-[13px] hover:bg-faint" style={{ borderColor: "rgb(var(--border) / 0.5)" }}>
                  <span className="flex items-center gap-2 py-2 pr-3" style={{ paddingLeft: pad + 30 }}>
                    <BadgePer p={it.periodicidade} />
                    {it.classificacao && <BadgeClassif c={it.classificacao} />}
                    <span className="truncate">{it.nome}</span>
                  </span>
                  <div className="orc-tot num">{brl(it.valorOrcado)}</div>
                  <div className="orc-tot num" style={{ color: "rgb(var(--muted))" }}>{brl(it.valorOrcadoMensal)}</div>
                  <Cel v={ess ? it.valorOrcadoMensal : 0} cor="rgb(var(--pos))" />
                  <Cel v={ess ? 0 : it.valorOrcadoMensal} cor="rgb(var(--amber))" />
                  <div className="orc-col-com truncate pl-2 text-[12px] italic" style={{ color: "rgb(var(--muted))" }}>{it.comentarios ?? ""}</div>
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
      <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>{k.label}</div>
            <div className="num font-display mt-1.5 text-[22px] font-semibold" style={{ color: `rgb(${k.cor})` }}>
              {brlK(k.val)}<span className="ml-1 text-[12px] font-normal" style={{ color: "rgb(var(--muted))" }}>/mês</span>
            </div>
            <div className="mt-1 text-[12px]" style={{ color: "rgb(var(--muted))" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-[15px] font-semibold">Plano de contas</h2>
        <div className="flex items-center gap-2">
          <NovoItem grupos={grupos} />
          <button type="button" onClick={toggleTudo}
            className="rounded-full border border-border px-4 py-1.5 text-[13px] font-medium hover:bg-faint">
            {tudo ? "Recolher tudo" : "Expandir tudo"}
          </button>
        </div>
      </div>

      {/* legenda de colunas (cabeçalho da planilha) */}
      <div className="orc-row rounded-t-xl border border-border bg-card px-5 py-2 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "rgb(var(--muted))" }}>
        <div>Conta</div>
        <div className="orc-tot">Orçado</div>
        <div className="orc-tot">Orçado mensal</div>
        <div className="orc-tot" style={{ color: "rgb(var(--pos))" }}>Essencial</div>
        <div className="orc-tot" style={{ color: "rgb(var(--amber))" }}>Condicionado</div>
        <div className="orc-col-com pl-2">Comentários</div>
      </div>

      {/* blocos raiz = cartões; a banda do cabeçalho é a linha de totais do bloco */}
      <div className="space-y-4 pt-4">
        {raizes.map((b) => {
          const r = rollupGrupo(b.codigo, grupos, linhas)
          const filhos = filhosDe(b.codigo)
          return (
            <div key={b.codigo} className="overflow-hidden rounded-2xl border border-border bg-card">
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
                <div className="orc-tot num font-display text-[17px] font-semibold" style={{ color: accRgb(b.tipo) }}>{brl(r.mensal)}</div>
                <div className="orc-tot num text-[13px] font-semibold" style={{ color: "rgb(var(--pos))" }}>{brl(r.essMensal)}</div>
                <div className="orc-tot num text-[13px] font-semibold" style={{ color: "rgb(var(--amber))" }}>{brl(r.condMensal)}</div>
                <div className="orc-col-com" />
              </button>
              {aberto(b.codigo) && <div>{filhos.map((f) => renderGrupo(f, 0))}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

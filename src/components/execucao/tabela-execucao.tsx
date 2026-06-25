"use client"
import { Fragment, useState, type ReactNode } from "react"
import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"
import { pendenciasPorGrupo, julgamentoDesvio } from "@/lib/services/execucao-service"
import { CampoRealizado } from "./campo-realizado"
import { CampoOrcado } from "./campo-orcado"
import { indexarExecucao, type NoExecucao } from "@/lib/services/arvore-execucao"

const brl = (n: number | null) => (n == null ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

const ACC: Record<string, string> = { R: "--pos", C: "--rose", D: "--info", E: "--amber" }
const TINT: Record<string, string> = { R: "--pos-soft", C: "--rose-soft", D: "--info-soft", E: "--amber-soft" }
const tipoDe = (codigo: string) => ({ "1": "R", "2": "C", "3": "D", "4": "E" }[codigo[0]] ?? "D")
const accRgb = (codigo: string) => `rgb(var(${ACC[tipoDe(codigo)]}))`
const tintRgb = (codigo: string) => `rgb(var(${TINT[tipoDe(codigo)]}))`
const corDesvio = (realizado: number | null, desvio: number, codigo: string) => {
  if (realizado == null) return "rgb(var(--muted) / 0.5)"
  const j = julgamentoDesvio(codigo, desvio)
  return j === "bom" ? "rgb(var(--pos))" : j === "ruim" ? "rgb(var(--danger))" : "rgb(var(--muted))"
}
// Seta de acessibilidade: ▲ quando estourou/pior, ▼ quando melhor/economia (não depende só de cor).
const setaDesvio = (codigo: string, desvio: number) => {
  const j = julgamentoDesvio(codigo, desvio)
  if (j === "neutro" || desvio === 0) return ""
  return desvio > 0 ? "▲ " : "▼ "
}

function Chevron({ aberto }: { aberto: boolean }) {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 transition-transform duration-200" style={{ color: "rgb(var(--muted))", transform: aberto ? "rotate(90deg)" : "none" }}
      fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function TabelaExecucao({
  ano, linhas, meses, editavel, mesesSemOrcado = [],
}: { ano: number; linhas: LinhaExecucao[]; meses: number[]; editavel: boolean; mesesSemOrcado?: number[] }) {
  // índice por nó: grupos por código, itens por id (nunca colidem)
  const { todos, raizes, filhosDe } = indexarExecucao(linhas)

  const [abertos, setAbertos] = useState<Set<string>>(() => new Set<string>())
  const [tudo, setTudo] = useState(false)
  const aberto = (chave: string) => abertos.has(chave)
  const toggle = (chave: string) => setAbertos((s) => { const n = new Set(s); if (n.has(chave)) n.delete(chave); else n.add(chave); return n })
  const codigosGrupos = todos.filter((e) => e.isGrupo && filhosDe(e.codigo).length > 0).map((e) => e.chave)
  const toggleTudo = () => {
    if (tudo) { setAbertos(new Set()); setTudo(false) }
    else { setAbertos(new Set(codigosGrupos)); setTudo(true) }
  }
  const btnTudo = (
    <button type="button" onClick={toggleTudo}
      className="rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium hover:bg-faint">
      {tudo ? "Recolher tudo" : "Expandir tudo"}
    </button>
  )

  const [mostrarOrcado, setMostrarOrcado] = useState(true)
  // Orçado visível por mês: respeita o toggle global e oculta nos meses fechados.
  const orcadoVisivel = (m: number) => mostrarOrcado && !mesesSemOrcado.includes(m)

  const umMes = meses.length === 1
  const pendencias = umMes ? pendenciasPorGrupo(linhas, meses[0]) : {}

  function BadgePend({ cod }: { cod: string }) {
    const n = pendencias[cod] ?? 0
    if (n === 0) return null
    return (
      <span aria-label={`${n} ${n === 1 ? "item" : "itens"} sem realizado`} title={`${n} sem realizado`}
        className="num inline-grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold"
        style={{ color: "rgb(var(--amber))", background: "rgb(var(--amber-soft))" }}>{n}</span>
    )
  }

  // ---------- MODO MÊS ÚNICO: cartões por bloco + accordion (igual Orçamentação) ----------
  function renderGrupoMes(e: NoExecucao, nivel: number): ReactNode {
    const mes = meses[0]
    const c = e.porMes.get(mes)
    const filhos = e.isGrupo ? filhosDe(e.codigo) : []   // item nunca é expansível
    const expansivel = filhos.length > 0
    const codEstilo = e.isGrupo ? e.codigo : e.codigoPai // estilo/tipo do item vem do pai
    const pad = 14 + nivel * 18
    const realizado = c?.realizado ?? null
    return (
      <div key={e.chave} className="border-t border-border">
        <div className={`exec-row ${e.isGrupo ? "bg-faint" : "hover:bg-faint"}`}>
          <button type="button" onClick={() => expansivel && toggle(e.chave)}
            className="flex items-center gap-2 py-2 pr-3 text-left text-[13px]" style={{ paddingLeft: pad }}>
            {expansivel
              ? <Chevron aberto={aberto(e.chave)} />
              : <span className="grid h-3.5 w-3.5 shrink-0 place-items-center"><span className="h-1 w-1 rounded-full" style={{ background: "rgb(var(--muted) / 0.55)" }} /></span>}
            <span className="num text-[11px]" style={{ color: "rgb(var(--muted) / 0.8)" }}>{e.isGrupo ? e.codigo : ""}</span>
            <span className={`truncate ${e.isGrupo ? "font-semibold" : ""}`}>{e.nome}</span>
            {e.isGrupo && <BadgePend cod={e.codigo} />}
          </button>
          <div className={`orc-tot num text-[13px] ${e.isGrupo ? "font-semibold" : ""}`} style={e.isGrupo ? { color: accRgb(codEstilo) } : undefined}>
            {editavel && !e.isGrupo && e.itemId != null
              ? <CampoOrcado ano={ano} mes={mes} itemId={e.itemId} valorInicial={c?.orcado ?? null} />
              : brl(c?.orcado ?? 0)}
          </div>
          <div className="orc-tot num text-[13px] px-2">
            {editavel && !e.isGrupo && e.itemId != null ? (
              <CampoRealizado ano={ano} mes={mes} itemId={e.itemId} valorInicial={realizado} />
            ) : (() => {
              const ehFolhaPendente = e.itemId != null && filhos.length === 0
              if (realizado != null) return <span>{brl(realizado)}</span>
              return (
                <span style={{ color: ehFolhaPendente ? "rgb(var(--amber))" : "rgb(var(--muted) / 0.6)" }}>
                  {ehFolhaPendente ? "pendente" : "—"}
                </span>
              )
            })()}
          </div>
          <div className="orc-tot num text-[13px] exec-hide-sm" style={{ color: corDesvio(realizado, c?.desvio ?? 0, codEstilo) }}>
            {realizado == null ? "—" : `${setaDesvio(codEstilo, c?.desvio ?? 0)}${brl(c?.desvio ?? 0)}`}
          </div>
        </div>
        {expansivel && aberto(e.chave) && <div>{filhos.map((f) => renderGrupoMes(f, nivel + 1))}</div>}
      </div>
    )
  }

  if (umMes) {
    return (
      <div className="space-y-2">
        <div className="flex justify-end">{btnTudo}</div>
        <div className="exec-row rounded-t-xl border border-border bg-card px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>
          <div>Conta</div>
          <div className="orc-tot">Orç. mensal</div>
          <div className="orc-tot px-2">Realizado</div>
          <div className="orc-tot exec-hide-sm">Desvio</div>
        </div>
        <div className="space-y-4 pt-2">
          {raizes.map((b) => {
            const c = b.porMes.get(meses[0])
            const filhos = filhosDe(b.codigo)
            return (
              <div key={b.chave} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="exec-row" style={{ background: tintRgb(b.codigo) }}>
                  <button type="button" onClick={() => toggle(b.chave)} className="flex items-center gap-3 px-3 py-3 text-left">
                    <Chevron aberto={aberto(b.chave)} />
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-sm font-bold bg-card" style={{ color: accRgb(b.codigo) }}>{b.nome[0]}</span>
                    <span className="font-display truncate text-[14px] font-semibold">{b.nome}</span>
                    <BadgePend cod={b.codigo} />
                  </button>
                  <div className="orc-tot num font-display text-[15px] font-semibold" style={{ color: accRgb(b.codigo) }}>{brl(c?.orcado ?? 0)}</div>
                  <div className="orc-tot num text-[13px] px-2 font-semibold">{c?.realizado == null ? "—" : brl(c.realizado)}</div>
                  <div className="orc-tot num text-[13px] exec-hide-sm" style={{ color: corDesvio(c?.realizado ?? null, c?.desvio ?? 0, b.codigo) }}>{c?.realizado == null ? "—" : `${setaDesvio(b.codigo, c?.desvio ?? 0)}${brl(c?.desvio ?? 0)}`}</div>
                </div>
                {aberto(b.chave) && <div>{filhos.map((f) => renderGrupoMes(f, 0))}</div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------- MODO PERÍODO: tabela hierárquica com 12 meses (realizado por mês) ----------
  const visiveis: { e: NoExecucao; nivel: number }[] = []
  const walk = (e: NoExecucao, nivel: number) => {
    visiveis.push({ e, nivel })
    if (e.isGrupo && aberto(e.chave)) for (const f of filhosDe(e.codigo)) walk(f, nivel + 1)
  }
  for (const r of raizes) walk(r, 0)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px]" style={{ color: "rgb(var(--muted))" }}>{mostrarOrcado ? "Orçado e realizado" : "Realizado"} por mês · realizado em vermelho = desvio negativo</p>
        <div className="flex items-center gap-2">
          {btnTudo}
          <button type="button" onClick={() => setMostrarOrcado((v) => !v)}
            className="rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium hover:bg-faint">
            {mostrarOrcado ? "Ocultar orçado" : "Mostrar orçado"}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: "rgb(var(--muted))" }}>
              <th rowSpan={2} className="sticky left-0 z-10 bg-card px-3 py-2 text-left align-bottom text-[11px] font-semibold uppercase tracking-wider">Conta</th>
              {meses.map((m) => (
                <th key={m} colSpan={orcadoVisivel(m) ? 2 : 1} className="border-l border-border px-2 py-1.5 text-center text-[11px] font-semibold">{MESES[m - 1]}</th>
              ))}
            </tr>
            <tr className="text-[10px]" style={{ color: "rgb(var(--muted))" }}>
              {meses.map((m) => (
                <Fragment key={m}>
                  {orcadoVisivel(m) && <th className="border-l border-border px-2 pb-1.5 text-right font-medium">Orçado</th>}
                  <th className={`px-2 pb-1.5 text-right font-medium ${orcadoVisivel(m) ? "" : "border-l border-border"}`}>Realiz.</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map(({ e, nivel }) => {
              const filhos = e.isGrupo ? filhosDe(e.codigo) : []
              const expansivel = filhos.length > 0
              const codEstilo = e.isGrupo ? e.codigo : e.codigoPai
              const fundo = e.codigoPai === "" ? tintRgb(e.codigo) : e.isGrupo ? "rgb(var(--faint))" : "rgb(var(--card))"
              const fundoLinha = e.codigoPai === "" ? tintRgb(e.codigo) : e.isGrupo ? "rgb(var(--faint))" : undefined
              return (
                <tr key={e.chave} className={`border-t border-border ${e.isGrupo ? "" : "hover:bg-faint"}`} style={fundoLinha ? { background: fundoLinha } : undefined}>
                  <td className="sticky left-0 z-10 px-3 py-1.5 whitespace-nowrap" style={{ background: fundo, paddingLeft: 12 + nivel * 16 }}>
                    <button type="button" onClick={() => expansivel && toggle(e.chave)} className="flex items-center gap-2 text-left">
                      {expansivel
                        ? <Chevron aberto={aberto(e.chave)} />
                        : <span className="grid h-3.5 w-3.5 shrink-0 place-items-center"><span className="h-1 w-1 rounded-full" style={{ background: "rgb(var(--muted) / 0.55)" }} /></span>}
                      <span className="num text-[10px]" style={{ color: "rgb(var(--muted) / 0.8)" }}>{e.isGrupo ? e.codigo : ""}</span>
                      <span className={`truncate ${e.isGrupo ? "font-semibold" : ""}`}>{e.nome}</span>
                    </button>
                  </td>
                  {meses.map((m) => {
                    const c = e.porMes.get(m)
                    const realizado = c?.realizado ?? null
                    return (
                      <Fragment key={m}>
                        {orcadoVisivel(m) && (
                          <td className="num border-l border-border px-2 py-1.5 text-right whitespace-nowrap" style={{ color: "rgb(var(--muted))" }}>
                            {editavel && !e.isGrupo && e.itemId != null
                              ? <CampoOrcado ano={ano} mes={m} itemId={e.itemId} valorInicial={c?.orcado ?? null} />
                              : brl(c?.orcado ?? 0)}
                          </td>
                        )}
                        <td className={`num px-2 py-1.5 text-right whitespace-nowrap ${orcadoVisivel(m) ? "" : "border-l border-border"}`} style={editavel && !e.isGrupo && e.itemId != null ? undefined : { color: corDesvio(realizado, c?.desvio ?? 0, codEstilo) }}>
                          {editavel && !e.isGrupo && e.itemId != null
                            ? <CampoRealizado ano={ano} mes={m} itemId={e.itemId} valorInicial={realizado} />
                            : realizado == null ? "—" : brl(realizado)}
                        </td>
                      </Fragment>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

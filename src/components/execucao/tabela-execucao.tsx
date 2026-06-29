"use client"
import { Fragment, useState, type ReactNode } from "react"
import { ChevronsUpDown, ChevronsDownUp } from "lucide-react"
import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"
import { pendenciasPorGrupo, julgamentoDesvio, formatarIndicador, type Indicador } from "@/lib/services/execucao-service"
import { btn } from "@/components/ui/botao"
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
  ano, linhas, meses, editavel, mesesSemOrcado = [], mesesFechados = [], acoesEdicao, indicadoresOrcado, indicadoresRealizado,
}: {
  ano: number; linhas: LinhaExecucao[]; meses: number[]; editavel: boolean; mesesSemOrcado?: number[]; acoesEdicao?: ReactNode
  // Meses concluídos: não exibem input de edição (mesmo com a trava no backend).
  mesesFechados?: number[]
  // Indicadores por mês (orcado[mes-1][i] / realizado[mes-1][i]) — exibidos como bloco no fim da tabela de período.
  indicadoresOrcado?: Indicador[][]; indicadoresRealizado?: Indicador[][]
}) {
  // índice por nó: grupos por código, itens por id (nunca colidem)
  const { todos, raizes, filhosDe } = indexarExecucao(linhas)

  const [abertos, setAbertos] = useState<Set<string>>(() => new Set<string>())
  const [tudo, setTudo] = useState(false)
  const [indAberto, setIndAberto] = useState(false)
  const aberto = (chave: string) => abertos.has(chave)
  const toggle = (chave: string) => setAbertos((s) => { const n = new Set(s); if (n.has(chave)) n.delete(chave); else n.add(chave); return n })
  const codigosGrupos = todos.filter((e) => e.isGrupo && filhosDe(e.codigo).length > 0).map((e) => e.chave)
  const toggleTudo = () => {
    if (tudo) { setAbertos(new Set()); setTudo(false) }
    else { setAbertos(new Set(codigosGrupos)); setTudo(true) }
  }
  const btnTudo = (
    <button type="button" onClick={toggleTudo} className={btn}
      title={tudo ? "Recolher tudo" : "Expandir tudo"} aria-label={tudo ? "Recolher tudo" : "Expandir tudo"}>
      {tudo
        ? <><ChevronsDownUp size={16} strokeWidth={2} aria-hidden /> <span className="hidden sm:inline">Recolher tudo</span></>
        : <><ChevronsUpDown size={16} strokeWidth={2} aria-hidden /> <span className="hidden sm:inline">Expandir tudo</span></>}
    </button>
  )

  // Orçado visível por mês: aberto sempre mostra; fechado só quando revelado pelo pai (mesesSemOrcado vazio).
  const orcadoVisivel = (m: number) => !mesesSemOrcado.includes(m)
  // Edição só em mês aberto: mês fechado nem exibe input (a trava do backend é a segunda barreira).
  const editavelMes = (m: number) => editavel && !mesesFechados.includes(m)

  const umMes = meses.length === 1
  // Pendências por grupo só importam na Visão mês (lista mobile do mês único).
  const pendencias = umMes ? pendenciasPorGrupo(linhas, meses[0]) : {}

  function BadgePend({ cod }: { cod: string }) {
    const n = pendencias[cod] ?? 0
    if (n === 0) return null
    // Pílula sólida âmbar: aponta quantos itens-folha da categoria ainda estão sem realizado.
    // Cor/forma consistentes com o alerta de check-in; texto explícito em aria/title (não só cor).
    const rotulo = `${n} ${n === 1 ? "item sem realizado" : "itens sem realizado"}`
    return (
      <span aria-label={rotulo} title={rotulo}
        className="num inline-grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full px-1.5 text-[11px] font-bold"
        style={{ color: "rgb(var(--background))", background: "rgb(var(--amber))" }}>{n}</span>
    )
  }

  // Valores empilhados (Orç. mensal / Realizado / Desvio) do modo lista mobile.
  // Reaproveita cores/setas e mantém a edição inline em itens-folha quando `editavel`.
  function ValoresMobile({ no, mes, codEstilo, mostrarOrcado = true }: { no: NoExecucao; mes: number; codEstilo: string; mostrarOrcado?: boolean }) {
    const c = no.porMes.get(mes)
    const realizado = c?.realizado ?? null
    const ehFolha = no.itemId != null && !no.isGrupo
    const editarCampo = editavel && ehFolha && no.itemId != null
    return (
      <div className="num flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        {/* meses fechados sem orçado revelado escondem a linha de orçado (vide orcadoVisivel) */}
        {mostrarOrcado && (
          <span className="flex items-center gap-1" style={{ color: "rgb(var(--muted))" }}>
            Orç.{" "}
            {editarCampo
              ? <CampoOrcado ano={ano} mes={mes} itemId={no.itemId!} valorInicial={c?.orcado ?? null} />
              : brl(c?.orcado ?? 0)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <span style={{ color: "rgb(var(--muted))" }}>Realiz.</span>{" "}
          {editarCampo
            ? <CampoRealizado ano={ano} mes={mes} itemId={no.itemId!} valorInicial={realizado} />
            : realizado == null
              ? <span style={{ color: ehFolha ? "rgb(var(--amber))" : "rgb(var(--muted) / 0.6)" }}>{ehFolha ? "pendente" : "—"}</span>
              : <span className="font-semibold">{brl(realizado)}</span>}
        </span>
        <span className="flex items-center gap-1">
          <span style={{ color: "rgb(var(--muted))" }}>Desvio</span>{" "}
          <span style={{ color: corDesvio(realizado, c?.desvio ?? 0, codEstilo) }}>
            {realizado == null ? "—" : `${setaDesvio(codEstilo, c?.desvio ?? 0)}${brl(c?.desvio ?? 0)}`}
          </span>
        </span>
      </div>
    )
  }

  // ---------- MODO MÊS ÚNICO: cartões por bloco + accordion (igual Orçamentação) ----------
  function renderGrupoMes(e: NoExecucao, nivel: number, mes: number): ReactNode {
    const c = e.porMes.get(mes)
    const filhos = e.isGrupo ? filhosDe(e.codigo) : []   // item nunca é expansível
    const expansivel = filhos.length > 0
    const codEstilo = e.isGrupo ? e.codigo : e.codigoPai // estilo/tipo do item vem do pai
    const pad = 14 + nivel * 18
    const realizado = c?.realizado ?? null
    // No período, meses fechados sem orçado revelado escondem a coluna de orçado; na Visão mês sempre mostra.
    const mostrarOrc = umMes || orcadoVisivel(mes)
    return (
      <div key={e.chave} className="border-t border-border">
        {/* grade (desktop) */}
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
          <div className="orc-tot num text-[13px]" style={{ color: corDesvio(realizado, c?.desvio ?? 0, codEstilo) }}>
            {realizado == null ? "—" : `${setaDesvio(codEstilo, c?.desvio ?? 0)}${brl(c?.desvio ?? 0)}`}
          </div>
        </div>
        {/* lista (mobile) — nome em cima, valores empilhados; itens com acento lateral do bloco */}
        <div className={`exec-mobile-row flex-col gap-1.5 ${e.isGrupo ? "bg-faint" : ""}`}
          style={e.isGrupo
            ? { paddingLeft: 10 + nivel * 14, paddingRight: 8, paddingTop: 10, paddingBottom: 10 }
            : { borderLeft: `3px solid ${accRgb(codEstilo)}`, paddingLeft: 12, paddingRight: 8, paddingTop: 10, paddingBottom: 10 }}>
          <button type="button" onClick={() => expansivel && toggle(e.chave)}
            className="flex w-full items-center gap-2 text-left">
            {expansivel
              ? <Chevron aberto={aberto(e.chave)} />
              : <span className="grid h-3.5 w-3.5 shrink-0 place-items-center"><span className="h-1 w-1 rounded-full" style={{ background: "rgb(var(--muted) / 0.55)" }} /></span>}
            <span className="num shrink-0 text-[11px]" style={{ color: "rgb(var(--muted) / 0.8)" }}>{e.isGrupo ? e.codigo : ""}</span>
            <span className={`line-clamp-2 flex-1 text-[13px] ${e.isGrupo ? "font-semibold" : ""}`}>{e.nome}</span>
            {e.isGrupo && <BadgePend cod={e.codigo} />}
          </button>
          <div className="pl-[1.375rem]"><ValoresMobile no={e} mes={mes} codEstilo={codEstilo} mostrarOrcado={mostrarOrc} /></div>
        </div>
        {expansivel && aberto(e.chave) && <div>{filhos.map((f) => renderGrupoMes(f, nivel + 1, mes))}</div>}
      </div>
    )
  }

  // Cartão de bloco (R/C/D/E) com cabeçalho + accordion de filhos para um mês.
  // Reaproveitado pela Visão mês (desktop+mobile) e pelo Período mobile (só a lista aparece ≤900px).
  function renderBlocoCard(b: NoExecucao, mes: number): ReactNode {
    const c = b.porMes.get(mes)
    const filhos = filhosDe(b.codigo)
    const mostrarOrc = umMes || orcadoVisivel(mes)
    return (
      <div key={b.chave} className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* cabeçalho do bloco — grade (desktop) */}
        <div className="exec-row" style={{ background: tintRgb(b.codigo) }}>
          <button type="button" onClick={() => toggle(b.chave)} className="flex items-center gap-3 px-3 py-3 text-left">
            <Chevron aberto={aberto(b.chave)} />
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-sm font-bold bg-card" style={{ color: accRgb(b.codigo) }}>{b.nome[0]}</span>
            <span className="font-display truncate text-[14px] font-semibold">{b.nome}</span>
            <BadgePend cod={b.codigo} />
          </button>
          <div className="orc-tot num font-display text-[15px] font-semibold" style={{ color: accRgb(b.codigo) }}>{brl(c?.orcado ?? 0)}</div>
          <div className="orc-tot num text-[13px] px-2 font-semibold">{c?.realizado == null ? "—" : brl(c.realizado)}</div>
          <div className="orc-tot num text-[13px]" style={{ color: corDesvio(c?.realizado ?? null, c?.desvio ?? 0, b.codigo) }}>{c?.realizado == null ? "—" : `${setaDesvio(b.codigo, c?.desvio ?? 0)}${brl(c?.desvio ?? 0)}`}</div>
        </div>
        {/* cabeçalho do bloco — lista (mobile) */}
        <div className="exec-mobile-row flex-col gap-1.5 px-3 py-3" style={{ background: tintRgb(b.codigo) }}>
          <button type="button" onClick={() => toggle(b.chave)} className="flex w-full items-center gap-3 text-left">
            <Chevron aberto={aberto(b.chave)} />
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-sm font-bold bg-card" style={{ color: accRgb(b.codigo) }}>{b.nome[0]}</span>
            <span className="font-display min-w-0 flex-1 truncate text-[14px] font-semibold">{b.nome}</span>
            <BadgePend cod={b.codigo} />
          </button>
          <div className="pl-11"><ValoresMobile no={b} mes={mes} codEstilo={b.codigo} mostrarOrcado={mostrarOrc} /></div>
        </div>
        {aberto(b.chave) && <div>{filhos.map((f) => renderGrupoMes(f, 0, mes))}</div>}
      </div>
    )
  }

  if (umMes) {
    return (
      <div className="space-y-2">
        {/* Barra de ações logo acima da tabela (espelha o cabeçalho da Orçamentação): edição + expandir/recolher juntos */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {acoesEdicao}
          {btnTudo}
        </div>
        <div className="exec-row rounded-t-xl border border-border bg-card px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>
          <div>Conta</div>
          <div className="orc-tot">Orç. mensal</div>
          <div className="orc-tot px-2">Realizado</div>
          <div className="orc-tot">Desvio</div>
        </div>
        <div className="space-y-4 pt-2">
          {raizes.map((b) => renderBlocoCard(b, meses[0]))}
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
        <p className="text-[12px]" style={{ color: "rgb(var(--muted))" }}>
          Orçado e realizado por mês · realizado em vermelho = desvio negativo
          {mesesSemOrcado.length > 0 && " · meses fechados sem orçado"}
        </p>
        <div className="flex items-center gap-2">
          {btnTudo}
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
                  {orcadoVisivel(m) && <th className="border-l border-border px-2 pb-1.5 text-center font-medium">Orçado</th>}
                  <th className={`px-2 pb-1.5 text-center font-medium ${orcadoVisivel(m) ? "" : "border-l border-border"}`}>Realiz.</th>
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
                            {editavelMes(m) && !e.isGrupo && e.itemId != null
                              ? <CampoOrcado ano={ano} mes={m} itemId={e.itemId} valorInicial={c?.orcado ?? null} />
                              : brl(c?.orcado ?? 0)}
                          </td>
                        )}
                        <td className={`num px-2 py-1.5 text-right whitespace-nowrap ${orcadoVisivel(m) ? "" : "border-l border-border"}`} style={editavelMes(m) && !e.isGrupo && e.itemId != null ? undefined : { color: corDesvio(realizado, c?.desvio ?? 0, codEstilo) }}>
                          {editavelMes(m) && !e.isGrupo && e.itemId != null
                            ? <CampoRealizado ano={ano} mes={m} itemId={e.itemId} valorInicial={realizado} />
                            : realizado == null ? "—" : brl(realizado)}
                        </td>
                      </Fragment>
                    )
                  })}
                </tr>
              )
            })}
            {/* Indicadores como bloco dentro da própria tabela (mesmas colunas de mês: orçado · realizado),
                seguindo o layout dos tipos de conta — cabeçalho expansível + linhas-filhas. */}
            {indicadoresRealizado && (indicadoresRealizado[0]?.length ?? 0) > 0 && (
              <>
                <tr className="border-t border-border" style={{ background: "rgb(var(--faint))" }}>
                  <td className="sticky left-0 z-10 px-3 py-1.5 whitespace-nowrap" style={{ background: "rgb(var(--faint))", paddingLeft: 12 }}>
                    <button type="button" onClick={() => setIndAberto((v) => !v)} className="flex items-center gap-2 text-left">
                      <Chevron aberto={indAberto} />
                      <span className="font-display text-[14px] font-semibold">Indicadores</span>
                    </button>
                  </td>
                  {meses.map((m) => (
                    <Fragment key={m}>
                      {orcadoVisivel(m) && <td className="border-l border-border" />}
                      <td className={orcadoVisivel(m) ? "" : "border-l border-border"} />
                    </Fragment>
                  ))}
                </tr>
                {indAberto && (indicadoresRealizado[0] ?? []).map((ind, i) => (
                  <tr key={ind.rotulo} className="border-t border-border hover:bg-faint">
                    <td className="sticky left-0 z-10 bg-card px-3 py-1.5 whitespace-nowrap" style={{ paddingLeft: 12 + 16 }}>{ind.rotulo}</td>
                    {meses.map((m) => {
                      const mi = m - 1
                      const o = indicadoresOrcado?.[mi]?.[i]
                      const r = indicadoresRealizado[mi]?.[i]
                      const rNeg = !!r && r.formato === "moeda" && !r.pendente && r.valor != null && r.valor < 0
                      return (
                        <Fragment key={m}>
                          {orcadoVisivel(m) && (
                            <td className="num border-l border-border px-2 py-1.5 text-right whitespace-nowrap" style={{ color: "rgb(var(--muted))" }}>
                              {o ? formatarIndicador(o) : "—"}
                            </td>
                          )}
                          <td className={`num px-2 py-1.5 text-right whitespace-nowrap ${orcadoVisivel(m) ? "" : "border-l border-border"}`}
                            style={rNeg ? { color: "rgb(var(--danger))" } : r?.pendente ? { color: "rgb(var(--muted) / 0.6)" } : undefined}>
                            {r ? formatarIndicador(r) : "—"}
                          </td>
                        </Fragment>
                      )
                    })}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

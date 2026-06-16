"use client"
import { useState, type ReactNode } from "react"
import type { LinhaExecucao } from "@/lib/repositories/execucao-repository"

const brl = (n: number | null) => (n == null ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

const ACC: Record<string, string> = { R: "--pos", C: "--rose", D: "--info", E: "--amber" }
const TINT: Record<string, string> = { R: "--pos-soft", C: "--rose-soft", D: "--info-soft", E: "--amber-soft" }
const tipoDe = (codigo: string) => ({ "1": "R", "2": "C", "3": "D", "4": "E" }[codigo[0]] ?? "D")
const accRgb = (codigo: string) => `rgb(var(${ACC[tipoDe(codigo)]}))`
const tintRgb = (codigo: string) => `rgb(var(${TINT[tipoDe(codigo)]}))`
const corDesvio = (realizado: number | null, desvio: number) =>
  realizado == null ? "rgb(var(--muted) / 0.5)" : desvio < 0 ? "rgb(var(--danger))" : "rgb(var(--pos))"

interface No {
  codigo: string; codigoPai: string; nome: string; isGrupo: boolean; itemId: number | null
  porMes: Map<number, LinhaExecucao>
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
  ano, linhas, meses, editavel,
}: { ano: number; linhas: LinhaExecucao[]; meses: number[]; editavel: boolean }) {
  // monta o índice por código com os dados de cada mês
  const info = new Map<string, No>()
  for (const l of linhas) {
    let e = info.get(l.codigo)
    if (!e) { e = { codigo: l.codigo, codigoPai: l.codigoPai, nome: l.nome, isGrupo: l.isGrupo, itemId: l.itemId, porMes: new Map() }; info.set(l.codigo, e) }
    e.porMes.set(l.mes, l)
  }
  const todos = [...info.values()]
  const raizes = todos.filter((e) => e.codigoPai === "").sort((a, b) => Number(a.codigo) - Number(b.codigo))
  const filhosDe = (cod: string) => todos.filter((e) => e.codigoPai === cod).sort((a, b) => Number(a.codigo) - Number(b.codigo))

  const [abertos, setAbertos] = useState<Set<string>>(() => new Set(raizes.map((r) => r.codigo)))
  const aberto = (cod: string) => abertos.has(cod)
  const toggle = (cod: string) => setAbertos((s) => { const n = new Set(s); if (n.has(cod)) n.delete(cod); else n.add(cod); return n })

  const [salvando, setSalvando] = useState<string | null>(null)
  const [aviso, setAviso] = useState("")
  async function salvarRealizado(itemId: number, mes: number, valor: number) {
    setSalvando(`${itemId}-${mes}`); setAviso("")
    const r = await fetch("/api/execucao/realizado", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ano, mes, contaItemId: itemId, valor }),
    })
    setSalvando(null)
    if (r.status === 409) setAviso("Competência fechada; reabra o mês para editar.")
    else if (!r.ok) setAviso("Falha ao gravar realizado.")
  }

  const umMes = meses.length === 1

  // ---------- MODO MÊS ÚNICO: cartões por bloco + accordion (igual Orçamentação) ----------
  function renderGrupoMes(e: No, nivel: number): ReactNode {
    const mes = meses[0]
    const c = e.porMes.get(mes)
    const filhos = filhosDe(e.codigo)
    const expansivel = filhos.length > 0
    const pad = 14 + nivel * 18
    const realizado = c?.realizado ?? null
    return (
      <div key={e.codigo} className="border-t border-border">
        <div className="exec-row hover:bg-faint">
          <button type="button" onClick={() => expansivel && toggle(e.codigo)}
            className="flex items-center gap-2 py-2 pr-3 text-left text-[13px]" style={{ paddingLeft: pad }}>
            {expansivel ? <Chevron aberto={aberto(e.codigo)} /> : <span className="inline-block h-3.5 w-3.5 shrink-0" />}
            <span className="num text-[11px]" style={{ color: "rgb(var(--muted) / 0.8)" }}>{e.codigo}</span>
            <span className={`truncate ${e.isGrupo ? "font-medium" : ""}`}>{e.nome}</span>
          </button>
          <div className="orc-tot num text-[13px] exec-hide-sm" style={{ color: "rgb(var(--muted))" }}>{brl(c?.orcadoProjetado ?? 0)}</div>
          <div className="orc-tot num text-[13px]">{brl(c?.orcado ?? 0)}</div>
          <div className="orc-tot num text-[13px] px-2">
            {editavel && !e.isGrupo && e.itemId != null ? (
              <input
                className="w-28 rounded border border-border bg-background p-1 text-right num"
                type="number" step="0.01" defaultValue={realizado ?? undefined} placeholder="pendente"
                disabled={salvando === `${e.itemId}-${mes}`}
                onBlur={(ev) => ev.target.value !== "" && salvarRealizado(e.itemId as number, mes, Number(ev.target.value))}
              />
            ) : (
              <span style={{ color: realizado == null ? "rgb(var(--muted) / 0.6)" : undefined }}>{realizado == null ? "pendente" : brl(realizado)}</span>
            )}
          </div>
          <div className="orc-tot num text-[13px] exec-hide-sm" style={{ color: corDesvio(realizado, c?.desvio ?? 0) }}>
            {realizado == null ? "—" : brl(c?.desvio ?? 0)}
          </div>
        </div>
        {expansivel && aberto(e.codigo) && <div>{filhos.map((f) => renderGrupoMes(f, nivel + 1))}</div>}
      </div>
    )
  }

  if (umMes) {
    return (
      <div className="space-y-2">
        {aviso && <p className="text-sm" style={{ color: "rgb(var(--danger))" }}>{aviso}</p>}
        <div className="exec-row rounded-t-xl border border-border bg-card px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>
          <div>Conta</div>
          <div className="orc-tot exec-hide-sm">Orç. projetado</div>
          <div className="orc-tot">Orç. mensal</div>
          <div className="orc-tot px-2">Realizado</div>
          <div className="orc-tot exec-hide-sm">Desvio</div>
        </div>
        <div className="space-y-4 pt-2">
          {raizes.map((b) => {
            const c = b.porMes.get(meses[0])
            const filhos = filhosDe(b.codigo)
            return (
              <div key={b.codigo} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="exec-row" style={{ background: tintRgb(b.codigo) }}>
                  <button type="button" onClick={() => toggle(b.codigo)} className="flex items-center gap-3 px-3 py-3 text-left">
                    <Chevron aberto={aberto(b.codigo)} />
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-sm font-bold bg-card" style={{ color: accRgb(b.codigo) }}>{b.nome[0]}</span>
                    <span className="font-display truncate text-[14px] font-semibold">{b.nome}</span>
                  </button>
                  <div className="orc-tot num text-[13px] exec-hide-sm" style={{ color: "rgb(var(--muted))" }}>{brl(c?.orcadoProjetado ?? 0)}</div>
                  <div className="orc-tot num font-display text-[15px] font-semibold" style={{ color: accRgb(b.codigo) }}>{brl(c?.orcado ?? 0)}</div>
                  <div className="orc-tot num text-[13px] px-2 font-semibold">{c?.realizado == null ? "—" : brl(c.realizado)}</div>
                  <div className="orc-tot num text-[13px] exec-hide-sm" style={{ color: corDesvio(c?.realizado ?? null, c?.desvio ?? 0) }}>{c?.realizado == null ? "—" : brl(c?.desvio ?? 0)}</div>
                </div>
                {aberto(b.codigo) && <div>{filhos.map((f) => renderGrupoMes(f, 0))}</div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------- MODO PERÍODO: tabela hierárquica com 12 meses (realizado por mês) ----------
  const visiveis: { e: No; nivel: number }[] = []
  const walk = (e: No, nivel: number) => {
    visiveis.push({ e, nivel })
    if (aberto(e.codigo)) for (const f of filhosDe(e.codigo)) walk(f, nivel + 1)
  }
  for (const r of raizes) walk(r, 0)

  return (
    <div className="space-y-2">
      <p className="text-[12px]" style={{ color: "rgb(var(--muted))" }}>Realizado por mês · vermelho = desvio negativo · clique nas categorias para expandir</p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: "rgb(var(--muted))" }}>
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">Conta</th>
              {meses.map((m) => (
                <th key={m} className="num border-l border-border px-2 py-2 text-right text-[11px] font-semibold">{MESES[m - 1]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map(({ e, nivel }) => {
              const filhos = filhosDe(e.codigo)
              const expansivel = filhos.length > 0
              return (
                <tr key={e.codigo} className="border-t border-border hover:bg-faint" style={e.codigoPai === "" ? { background: tintRgb(e.codigo) } : undefined}>
                  <td className="sticky left-0 z-10 px-3 py-1.5 whitespace-nowrap" style={{ background: e.codigoPai === "" ? tintRgb(e.codigo) : "rgb(var(--card))", paddingLeft: 12 + nivel * 16 }}>
                    <button type="button" onClick={() => expansivel && toggle(e.codigo)} className="flex items-center gap-2 text-left">
                      {expansivel ? <Chevron aberto={aberto(e.codigo)} /> : <span className="inline-block h-3.5 w-3.5 shrink-0" />}
                      <span className="num text-[10px]" style={{ color: "rgb(var(--muted) / 0.8)" }}>{e.codigo}</span>
                      <span className={`truncate ${e.isGrupo ? "font-medium" : ""}`}>{e.nome}</span>
                    </button>
                  </td>
                  {meses.map((m) => {
                    const c = e.porMes.get(m)
                    const realizado = c?.realizado ?? null
                    return (
                      <td key={m} className="num border-l border-border px-2 py-1.5 text-right whitespace-nowrap"
                        style={{ color: corDesvio(realizado, c?.desvio ?? 0) }}>
                        {realizado == null ? "—" : brl(realizado)}
                      </td>
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

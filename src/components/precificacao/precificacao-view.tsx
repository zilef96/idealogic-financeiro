"use client"
import { useMemo, useState } from "react"
import { fmtValor } from "@/components/dashboard/formatos"
import { TRILHAS, type LinhaProgressao, type Trilha } from "@/lib/services/progressao-service"
import {
  PREMISSAS_PADRAO, custoHora, precoPara, resultado, tetoHoras, type Premissas, type Resultado,
} from "@/lib/services/precificacao-service"

const NOMES_MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
// Sem horas faturáveis informadas no Financeiro, parte do número da planilha antiga.
const HORAS_FATURAVEIS_FALLBACK = 1240

type Modo = "hora" | "projeto" | "recorrencia"
const MODOS: { modo: Modo; rotulo: string }[] = [
  { modo: "hora", rotulo: "Outsourcing (por hora)" },
  { modo: "projeto", rotulo: "Projeto / implantação" },
  { modo: "recorrencia", rotulo: "Recorrência (mensalidade)" },
]

const moeda = (v: number | null) => fmtValor(v, "moeda", { centavos: true })
const pct = (v: number | null) => (v == null ? "—" : `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`)
const horas = (v: number | null) => (v == null ? "—" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`)
const num = (s: string) => {
  const n = Number(s.replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>{titulo}</h2>
      {children}
    </section>
  )
}

function Campo({ rotulo, valor, onMudar, sufixo, ajuda }: { rotulo: string; valor: string; onMudar: (v: string) => void; sufixo?: string; ajuda?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>{rotulo}</span>
      <div className="flex items-center gap-1.5">
        <input inputMode="decimal" value={valor} onChange={(e) => onMudar(e.target.value)}
          className="h-8 w-full rounded-[10px] border border-border bg-card px-2 text-right text-[13px] num" />
        {sufixo && <span className="shrink-0 text-xs" style={{ color: "rgb(var(--muted))" }}>{sufixo}</span>}
      </div>
      {ajuda && <span className="block text-[11px]" style={{ color: "rgb(var(--muted))" }}>{ajuda}</span>}
    </label>
  )
}

function Selecao<T extends string>({ rotulo, valor, opcoes, onMudar }: { rotulo: string; valor: T; opcoes: { valor: T; rotulo: string }[]; onMudar: (v: T) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>{rotulo}</span>
      <select value={valor} onChange={(e) => onMudar(e.target.value as T)}
        className="h-8 w-full rounded-[10px] border border-border bg-card px-2 text-[13px]">
        {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
      </select>
    </label>
  )
}

function Cartao({ titulo, valor, detalhe, cor }: { titulo: string; valor: string; detalhe?: string; cor?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>{titulo}</div>
      <div className="mt-1 text-xl font-semibold num" style={{ color: cor }}>{valor}</div>
      {detalhe && <div className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>{detalhe}</div>}
    </div>
  )
}

// Verde = bate a margem alvo; amarelo = lucro abaixo do alvo; vermelho = prejuízo.
function corMargem(margemAntesIr: number | null, alvo: number): string | undefined {
  if (margemAntesIr == null) return undefined
  if (margemAntesIr >= alvo - 1e-9) return "rgb(var(--pos))"
  if (margemAntesIr > 0) return "rgb(var(--amber))"
  return "rgb(var(--neg))"
}

function Demonstrativo({ r, titulo }: { r: Resultado; titulo: string }) {
  const linhas: { rotulo: string; valor: number; destaque?: boolean; pct?: number | null }[] = [
    { rotulo: "Preço", valor: r.preco, destaque: true },
    { rotulo: "(−) Impostos sobre faturamento", valor: -r.impostos },
    { rotulo: "(−) Comissões", valor: -r.comissoes },
    { rotulo: "(−) Custo da pessoa", valor: -r.custoPessoa },
    { rotulo: "(−) OPEX", valor: -r.custoOpex },
    { rotulo: "= Lucro antes de IRPJ/CSLL", valor: r.lucroAntesIr, destaque: true, pct: r.margemAntesIr },
    { rotulo: "(−) IRPJ/CSLL", valor: -r.irCsll },
    { rotulo: "= Lucro líquido", valor: r.lucroLiquido, destaque: true, pct: r.margemLiquida },
  ]
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[360px] text-sm">
        <thead>
          <tr className="border-b border-border text-left" style={{ color: "rgb(var(--muted))" }}>
            <th className="px-3 py-2 font-medium">{titulo}</th>
            <th className="px-3 py-2 text-right font-medium">R$</th>
            <th className="px-3 py-2 text-right font-medium">% do preço</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.rotulo} className={`border-b border-border/60 last:border-b-0 ${l.destaque ? "font-semibold" : ""}`}>
              <td className="px-3 py-1.5">{l.rotulo}</td>
              <td className="px-3 py-1.5 text-right num" style={{ color: l.valor < 0 && l.destaque ? "rgb(var(--neg))" : undefined }}>{moeda(l.valor)}</td>
              <td className="px-3 py-1.5 text-right num">{l.pct !== undefined ? pct(l.pct) : r.preco > 0 ? pct(Math.abs(l.valor) / r.preco) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Abas({ valor, onTrocar }: { valor: Modo; onTrocar: (m: Modo) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2 border-b border-border">
      {MODOS.map((m) => (
        <button key={m.modo} role="tab" aria-selected={valor === m.modo} onClick={() => onTrocar(m.modo)}
          className={`px-3 py-2 text-sm ${valor === m.modo ? "border-b-2 border-foreground font-medium" : "text-muted"}`}>
          {m.rotulo}
        </button>
      ))}
    </div>
  )
}

export function PrecificacaoView({ anoTabela, perfis, opex, horasFaturaveis }: {
  anoTabela: number
  perfis: LinhaProgressao[]
  opex: { media: number; mesesUsados: number[] } | null
  horasFaturaveis: number | null
}) {
  // ---- Premissas (texto pra permitir vírgula; convertidas na hora do cálculo)
  const [horasPessoa, setHorasPessoa] = useState(String(PREMISSAS_PADRAO.horasPessoaMes))
  const [opexMensal, setOpexMensal] = useState(opex ? opex.media.toFixed(2) : "0")
  const [horasEmpresa, setHorasEmpresa] = useState(String(horasFaturaveis ?? HORAS_FATURAVEIS_FALLBACK))
  const [impostos, setImpostos] = useState(String(PREMISSAS_PADRAO.impostosFaturamento * 100))
  const [comissoes, setComissoes] = useState(String(PREMISSAS_PADRAO.comissoes * 100))
  const [margem, setMargem] = useState(String(PREMISSAS_PADRAO.margemAlvo * 100))
  const [ir, setIr] = useState(String(PREMISSAS_PADRAO.irCsll * 100))

  const horasEmpresaNum = num(horasEmpresa)
  const p: Premissas = {
    horasPessoaMes: num(horasPessoa),
    opexHora: horasEmpresaNum > 0 ? num(opexMensal) / horasEmpresaNum : 0,
    impostosFaturamento: num(impostos) / 100,
    comissoes: num(comissoes) / 100,
    margemAlvo: num(margem) / 100,
    irCsll: num(ir) / 100,
  }

  // ---- Perfil (trilha → cargo → maturidade/nível)
  const trilhasDisponiveis = TRILHAS.filter((t) => perfis.some((l) => l.trilha === t.trilha))
  const [trilha, setTrilha] = useState<Trilha>(trilhasDisponiveis[0]?.trilha ?? "tech")
  const cargos = useMemo(() => {
    const vistos = new Map<string, number>()
    for (const l of perfis) if (l.trilha === trilha && !vistos.has(l.cargo)) vistos.set(l.cargo, l.ordemCargo)
    return [...vistos.entries()].sort((a, b) => a[1] - b[1]).map(([c]) => c)
  }, [perfis, trilha])
  const [cargoEscolhido, setCargo] = useState("")
  const cargo = cargos.includes(cargoEscolhido) ? cargoEscolhido : (cargos[0] ?? "")
  const niveis = useMemo(
    () => perfis.filter((l) => l.trilha === trilha && l.cargo === cargo).sort((a, b) => a.ordemNivel - b.ordemNivel),
    [perfis, trilha, cargo],
  )
  const [nivelEscolhido, setNivel] = useState("")
  const nivel = niveis.find((l) => String(l.ordemNivel) === nivelEscolhido) ?? niveis[0]
  const salario = nivel?.valor ?? 0
  const custo = custoHora(salario, p)

  // ---- Modos
  const [modo, setModo] = useState<Modo>("hora")
  const [precoPraticado, setPrecoPraticado] = useState("")
  const [valorProjeto, setValorProjeto] = useState("")
  const [horasProjeto, setHorasProjeto] = useState("")
  const [mensalidade, setMensalidade] = useState("")
  const [implantacao, setImplantacao] = useState("")
  const [horasMes, setHorasMes] = useState("")
  const [mesesContrato, setMesesContrato] = useState("12")

  const precoEmpate = precoPara(custo.total, p, 0)
  const precoAlvo = precoPara(custo.total, p, p.margemAlvo)
  const premissasInvalidas = precoAlvo == null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Precificação</h1>
        <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
          Custo da pessoa pela tabela de Progressão {anoTabela} (valor PJ) mais o OPEX por hora.
          As premissas podem ser ajustadas e o cálculo é refeito na hora. Nada aqui é salvo.
        </p>
      </div>

      <Secao titulo="Premissas">
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
          <Campo rotulo="OPEX do mês" valor={opexMensal} onMudar={setOpexMensal} sufixo="R$"
            ajuda={opex ? `Média realizada de ${opex.mesesUsados.map((m) => NOMES_MES[m - 1]).join(", ")} (Despesas, sem distribuição de lucros)` : "Sem realizado no ano; informe o valor"} />
          <Campo rotulo="Horas faturáveis da empresa no mês" valor={horasEmpresa} onMudar={setHorasEmpresa} sufixo="h"
            ajuda={horasFaturaveis ? "Dos parâmetros do Financeiro" : "Não informado no Financeiro; valor da planilha antiga"} />
          <div className="rounded-[10px] p-2" style={{ background: "rgb(var(--faint))" }}>
            <div className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>OPEX por hora</div>
            <div className="mt-1 text-lg font-semibold num">{moeda(p.opexHora)}</div>
          </div>
          <Campo rotulo="Horas de uma pessoa no mês" valor={horasPessoa} onMudar={setHorasPessoa} sufixo="h" />
          <Campo rotulo="Impostos sobre faturamento" valor={impostos} onMudar={setImpostos} sufixo="%" />
          <Campo rotulo="Comissões" valor={comissoes} onMudar={setComissoes} sufixo="%" />
          <Campo rotulo="Margem alvo (antes do IR)" valor={margem} onMudar={setMargem} sufixo="%" ajuda="Sobre o preço" />
          <Campo rotulo="IRPJ + CSLL sobre o lucro" valor={ir} onMudar={setIr} sufixo="%" />
        </div>
        {premissasInvalidas && (
          <p className="text-sm" style={{ color: "rgb(var(--neg))" }}>Impostos + comissões + margem passam de 100%: não existe preço possível.</p>
        )}
      </Secao>

      <Secao titulo="Perfil de quem executa">
        {perfis.length === 0 ? (
          <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>Nenhuma tabela de progressão cadastrada.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Selecao rotulo="Trilha" valor={trilha} onMudar={(v) => { setTrilha(v); setCargo(""); setNivel("") }}
              opcoes={trilhasDisponiveis.map((t) => ({ valor: t.trilha, rotulo: t.rotulo }))} />
            <Selecao rotulo="Cargo" valor={cargo} onMudar={(v) => { setCargo(v); setNivel("") }}
              opcoes={cargos.map((c) => ({ valor: c, rotulo: c }))} />
            <Selecao rotulo="Maturidade e nível" valor={String(nivel?.ordemNivel ?? "")} onMudar={setNivel}
              opcoes={niveis.map((l) => ({ valor: String(l.ordemNivel), rotulo: `${l.maturidade} ${l.nivel} — ${moeda(l.valor)}` }))} />
            <div className="rounded-[10px] p-2" style={{ background: "rgb(var(--faint))" }}>
              <div className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>Custo da hora</div>
              <div className="mt-1 text-lg font-semibold num">{moeda(custo.total)}</div>
              <div className="text-[11px]" style={{ color: "rgb(var(--muted))" }}>{moeda(custo.pessoa)} pessoa + {moeda(custo.opex)} OPEX</div>
            </div>
          </div>
        )}
      </Secao>

      <div className="space-y-4">
        <Abas valor={modo} onTrocar={setModo} />

        {modo === "hora" && (() => {
          const praticado = num(precoPraticado)
          const rPraticado = praticado > 0 ? resultado(praticado, custo.pessoa, custo.opex, p) : null
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Cartao titulo="Preço mínimo (empate)" valor={moeda(precoEmpate)} detalhe="Abaixo disso, a hora dá prejuízo" />
                <Cartao titulo={`Preço alvo (margem ${pct(p.margemAlvo)})`} valor={moeda(precoAlvo)}
                  detalhe={precoAlvo ? `${moeda(precoAlvo * p.horasPessoaMes)} por mês com ${p.horasPessoaMes} h` : undefined} />
                <div className="rounded-xl border border-border bg-card p-4">
                  <Campo rotulo="E se o cliente pagar (R$/h)?" valor={precoPraticado} onMudar={setPrecoPraticado} sufixo="R$/h" />
                  {rPraticado && (
                    <div className="mt-2 text-sm font-semibold" style={{ color: corMargem(rPraticado.margemAntesIr, p.margemAlvo) }}>
                      Margem {pct(rPraticado.margemAntesIr)} antes do IR · {pct(rPraticado.margemLiquida)} líquida
                    </div>
                  )}
                </div>
              </div>
              {precoAlvo != null && <Demonstrativo titulo="Uma hora no preço alvo" r={resultado(precoAlvo, custo.pessoa, custo.opex, p)} />}
              {rPraticado && <Demonstrativo titulo="Uma hora no preço informado" r={rPraticado} />}
            </div>
          )
        })()}

        {modo === "projeto" && (() => {
          const valor = num(valorProjeto)
          const hs = num(horasProjeto)
          const precoSugerido = hs > 0 ? precoPara(custo.total * hs, p, p.margemAlvo) : null
          const r = valor > 0 && hs > 0 ? resultado(valor, custo.pessoa * hs, custo.opex * hs, p) : null
          return (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                Informe o valor combinado para saber até quantas horas o projeto aguenta, ou as horas estimadas para ver o preço sugerido. Com os dois, aparece a margem.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Campo rotulo="Valor combinado do projeto" valor={valorProjeto} onMudar={setValorProjeto} sufixo="R$" />
                <Campo rotulo="Horas estimadas" valor={horasProjeto} onMudar={setHorasProjeto} sufixo="h" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Cartao titulo="Teto de horas (empate)" valor={valor > 0 ? horas(tetoHoras(valor, custo.total, p, 0)) : "—"} detalhe="Passou disso, o projeto dá prejuízo" />
                <Cartao titulo={`Teto de horas (margem ${pct(p.margemAlvo)})`} valor={valor > 0 ? horas(tetoHoras(valor, custo.total, p, p.margemAlvo)) : "—"} />
                <Cartao titulo="Preço sugerido pelas horas" valor={moeda(precoSugerido)} />
              </div>
              {r && (
                <>
                  <div className="text-sm font-semibold" style={{ color: corMargem(r.margemAntesIr, p.margemAlvo) }}>
                    Com {horas(hs)}, o projeto fica com margem de {pct(r.margemAntesIr)} antes do IR e {pct(r.margemLiquida)} líquida.
                  </div>
                  <Demonstrativo titulo="Projeto inteiro" r={r} />
                </>
              )}
            </div>
          )
        })()}

        {modo === "recorrencia" && (() => {
          const mensal = num(mensalidade)
          const impl = num(implantacao)
          const meses = Math.max(1, Math.round(num(mesesContrato)))
          const hMes = num(horasMes)
          const totalContrato = mensal * meses + impl
          const rMes = mensal > 0 && hMes > 0 ? resultado(mensal, custo.pessoa * hMes, custo.opex * hMes, p) : null
          return (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                Mostra até quantas horas por mês a mensalidade aguenta. Com as horas estimadas, aparece a margem por mês.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Campo rotulo="Mensalidade" valor={mensalidade} onMudar={setMensalidade} sufixo="R$" />
                <Campo rotulo="Implantação (opcional)" valor={implantacao} onMudar={setImplantacao} sufixo="R$" />
                <Campo rotulo="Meses de contrato" valor={mesesContrato} onMudar={setMesesContrato} />
                <Campo rotulo="Horas estimadas por mês" valor={horasMes} onMudar={setHorasMes} sufixo="h" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Cartao titulo="Teto de horas por mês (empate)" valor={mensal > 0 ? horas(tetoHoras(mensal, custo.total, p, 0)) : "—"} />
                <Cartao titulo={`Teto de horas por mês (margem ${pct(p.margemAlvo)})`} valor={mensal > 0 ? horas(tetoHoras(mensal, custo.total, p, p.margemAlvo)) : "—"} />
                <Cartao titulo={`Valor do contrato em ${meses} meses`} valor={moeda(totalContrato)}
                  detalhe={impl > 0 ? `${moeda(impl)} de implantação + ${meses} × ${moeda(mensal)}` : undefined} />
              </div>
              {rMes && (
                <>
                  <div className="text-sm font-semibold" style={{ color: corMargem(rMes.margemAntesIr, p.margemAlvo) }}>
                    Com {horas(hMes)} por mês, a mensalidade fica com margem de {pct(rMes.margemAntesIr)} antes do IR e {pct(rMes.margemLiquida)} líquida.
                  </div>
                  <Demonstrativo titulo="Um mês de contrato" r={rMes} />
                </>
              )}
              {impl > 0 && (
                <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                  Para a implantação, use a aba Projeto: ela mostra até quantas horas os {moeda(impl)} aguentam.
                </p>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

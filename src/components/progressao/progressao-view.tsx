"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { fmtValor } from "@/components/dashboard/formatos"
import { REGIMES, TEMPO_POR_MATURIDADE, TRILHAS, type Grade, type Regime, type Trilha } from "@/lib/services/progressao-service"

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>{titulo}</h2>
      {children}
    </section>
  )
}

function TabelaGrade({ grade }: { grade: Grade }) {
  // Cargo fica fixo à esquerda: a grade tem até 27 níveis e rola na horizontal.
  const fixa = "sticky left-0 z-10 bg-card"
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="text-sm">
        <thead>
          <tr className="border-b border-border" style={{ color: "rgb(var(--muted))" }}>
            <th rowSpan={2} className={`${fixa} min-w-[200px] px-3 py-2 text-left font-medium`}>Cargo</th>
            {grade.maturidades.map((m, i) => (
              <th key={`${m.maturidade}-${i}`} colSpan={m.colunas} className="border-l border-border px-3 py-2 text-center font-semibold" style={{ color: "rgb(var(--foreground))" }}>
                {m.maturidade}
              </th>
            ))}
          </tr>
          <tr className="border-b border-border" style={{ color: "rgb(var(--muted))" }}>
            {grade.colunas.map((c, i) => (
              <th key={c.ordemNivel} className={`px-3 py-1.5 text-right text-xs font-medium ${i === 0 || grade.colunas[i - 1].maturidade !== c.maturidade ? "border-l border-border" : ""}`}>
                {c.nivel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grade.cargos.map((cargo) => (
            <tr key={cargo.cargo} className="border-b border-border/60 last:border-b-0">
              <td className={`${fixa} px-3 py-1.5 font-medium`}>{cargo.cargo}</td>
              {cargo.valores.map((v, i) => (
                <td key={grade.colunas[i].ordemNivel} className={`whitespace-nowrap px-3 py-1.5 text-right ${i === 0 || grade.colunas[i - 1].maturidade !== grade.colunas[i].maturidade ? "border-l border-border" : ""}`}>
                  {v == null ? <span style={{ color: "rgb(var(--muted))" }}>—</span> : <span className="num">{fmtValor(v, "moeda", { centavos: true })}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Abas<T extends string>({ opcoes, valor, onTrocar }: { opcoes: { valor: T; rotulo: string }[]; valor: T; onTrocar: (v: T) => void }) {
  return (
    <div role="tablist" className="flex gap-2 border-b border-border">
      {opcoes.map((o) => (
        <button key={o.valor} role="tab" aria-selected={valor === o.valor} onClick={() => onTrocar(o.valor)}
          className={`px-3 py-2 text-sm ${valor === o.valor ? "border-b-2 border-foreground font-medium" : "text-muted"}`}>
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}

export function ProgressaoView({ ano, anos, grades }: { ano: number; anos: number[]; grades: Grade[] }) {
  const router = useRouter()
  const [trilha, setTrilha] = useState<Trilha>("tech")
  const [regime, setRegime] = useState<Regime>("PJ")
  const grade = grades.find((g) => g.trilha === trilha && g.regime === regime)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Progressão Salarial {ano}</h1>
          <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
            Valor mensal por cargo, maturidade e nível. É a base de custo usada na Precificação.
          </p>
        </div>
        {anos.length > 1 && (
          <select value={ano} onChange={(e) => router.push(`/progressao?ano=${e.target.value}`)}
            className="h-8 rounded-[10px] border border-border bg-card px-2 text-[13px]" aria-label="Ano">
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      </div>

      {grades.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm" style={{ color: "rgb(var(--muted))" }}>
          Nenhuma tabela de progressão cadastrada para {ano}.
        </p>
      ) : (
        <Secao titulo="Tabela">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Abas opcoes={TRILHAS.map((t) => ({ valor: t.trilha, rotulo: t.rotulo }))} valor={trilha} onTrocar={setTrilha} />
            <Abas opcoes={REGIMES.map((r) => ({ valor: r, rotulo: r }))} valor={regime} onTrocar={setRegime} />
          </div>
          {grade
            ? <TabelaGrade grade={grade} />
            : <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>Sem valores para essa combinação.</p>}
        </Secao>
      )}

      <Secao titulo="Como se sobe de nível">
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left" style={{ color: "rgb(var(--muted))" }}>
                <th className="px-3 py-2 font-medium">Maturidade</th>
                <th className="px-3 py-2 font-medium">Níveis</th>
                <th className="px-3 py-2 font-medium">Tempo em cada nível</th>
                <th className="px-3 py-2 font-medium">Tempo acumulado ao fim</th>
              </tr>
            </thead>
            <tbody>
              {TEMPO_POR_MATURIDADE.map((t) => (
                <tr key={t.maturidade} className="border-b border-border/60 last:border-b-0">
                  <td className="px-3 py-1.5 font-medium">{t.maturidade}</td>
                  <td className="px-3 py-1.5">{t.niveis}</td>
                  <td className="px-3 py-1.5">{t.tempoNoNivel}</td>
                  <td className="px-3 py-1.5">{t.acumuladoAoFim}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Além do tempo de referência, a subida depende do desempenho na avaliação do líder
          (Protagonismo, Responsabilidade, Integridade e Parceria). Tempos da trilha Tech.
        </p>
      </Secao>
    </div>
  )
}

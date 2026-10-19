// Progressão salarial: monta as grades (cargo × nível) a partir das linhas do banco.
// Regra pura — sem acesso a banco — pra ser testada isoladamente.

export type Trilha = "tech" | "backstage"
export type Regime = "PJ" | "CLT"

export type LinhaProgressao = {
  trilha: Trilha
  regime: Regime
  cargo: string
  ordemCargo: number
  maturidade: string
  nivel: number
  ordemNivel: number
  valor: number
}

export type ColunaNivel = { ordemNivel: number; maturidade: string; nivel: number }
export type GrupoMaturidade = { maturidade: string; colunas: number }
export type CargoGrade = { cargo: string; valores: (number | null)[] }

export type Grade = {
  trilha: Trilha
  regime: Regime
  maturidades: GrupoMaturidade[]
  colunas: ColunaNivel[]
  cargos: CargoGrade[]
}

export const TRILHAS: { trilha: Trilha; rotulo: string }[] = [
  { trilha: "tech", rotulo: "Tech" },
  { trilha: "backstage", rotulo: "Backstage" },
]
export const REGIMES: Regime[] = ["PJ", "CLT"]

// Uma grade por trilha × regime, na ordem de TRILHAS/REGIMES. Colunas = todos os
// níveis que aparecem em algum cargo da grade; célula sem valor fica null (cargo
// sem aquele nível). Cargo sem nenhum valor não aparece.
export function montarGrades(linhas: LinhaProgressao[]): Grade[] {
  const grades: Grade[] = []
  for (const { trilha } of TRILHAS) {
    for (const regime of REGIMES) {
      const doGrupo = linhas.filter((l) => l.trilha === trilha && l.regime === regime)
      if (doGrupo.length === 0) continue

      const porNivel = new Map<number, ColunaNivel>()
      for (const l of doGrupo) porNivel.set(l.ordemNivel, { ordemNivel: l.ordemNivel, maturidade: l.maturidade, nivel: l.nivel })
      const colunas = [...porNivel.values()].sort((a, b) => a.ordemNivel - b.ordemNivel)

      const maturidades: GrupoMaturidade[] = []
      for (const c of colunas) {
        const ultimo = maturidades.at(-1)
        if (ultimo?.maturidade === c.maturidade) ultimo.colunas++
        else maturidades.push({ maturidade: c.maturidade, colunas: 1 })
      }

      const porCargo = new Map<string, { ordem: number; valores: Map<number, number> }>()
      for (const l of doGrupo) {
        const c = porCargo.get(l.cargo) ?? { ordem: l.ordemCargo, valores: new Map() }
        c.valores.set(l.ordemNivel, l.valor)
        porCargo.set(l.cargo, c)
      }
      const cargos = [...porCargo.entries()]
        .sort((a, b) => a[1].ordem - b[1].ordem)
        .map(([cargo, c]) => ({ cargo, valores: colunas.map((col) => c.valores.get(col.ordemNivel) ?? null) }))

      grades.push({ trilha, regime, maturidades, colunas, cargos })
    }
  }
  return grades
}

// Critérios de evolução (aba Premissas Tech da planilha "Salários 2026").
// Tempo de referência para subir de nível, além do desempenho avaliado pelo líder
// (Protagonismo, Responsabilidade, Integridade, Parceria).
export const TEMPO_POR_MATURIDADE: { maturidade: string; niveis: number; tempoNoNivel: string; acumuladoAoFim: string }[] = [
  { maturidade: "Trainee", niveis: 3, tempoNoNivel: "6 meses", acumuladoAoFim: "1 ano" },
  { maturidade: "Júnior", niveis: 3, tempoNoNivel: "6 meses", acumuladoAoFim: "2,5 anos" },
  { maturidade: "Pleno", niveis: 5, tempoNoNivel: "6 meses", acumuladoAoFim: "5 anos" },
  { maturidade: "Sênior", niveis: 7, tempoNoNivel: "1 ano", acumuladoAoFim: "12 anos" },
  { maturidade: "Lead", niveis: 9, tempoNoNivel: "1 ano", acumuladoAoFim: "19 anos (no Lead 7)" },
]

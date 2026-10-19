import { describe, it, expect } from "vitest"
import { montarGrades, type LinhaProgressao } from "@/lib/services/progressao-service"

function linha(p: Partial<LinhaProgressao>): LinhaProgressao {
  return { trilha: "tech", regime: "PJ", cargo: "Backend", ordemCargo: 1, maturidade: "Júnior", nivel: 1, ordemNivel: 1, valor: 1000, ...p }
}

describe("montarGrades", () => {
  it("uma grade por trilha × regime, na ordem Tech/Backstage e PJ/CLT, pulando as vazias", () => {
    const grades = montarGrades([
      linha({ trilha: "backstage", regime: "CLT" }),
      linha({ trilha: "tech", regime: "CLT" }),
      linha({ trilha: "tech", regime: "PJ" }),
    ])
    expect(grades.map((g) => `${g.trilha}/${g.regime}`)).toEqual(["tech/PJ", "tech/CLT", "backstage/CLT"])
  })

  it("colunas ordenadas por nível e agrupadas por maturidade", () => {
    const [g] = montarGrades([
      linha({ maturidade: "Pleno", nivel: 1, ordemNivel: 4 }),
      linha({ maturidade: "Júnior", nivel: 2, ordemNivel: 2 }),
      linha({ maturidade: "Júnior", nivel: 1, ordemNivel: 1 }),
    ])
    expect(g.colunas.map((c) => `${c.maturidade}${c.nivel}`)).toEqual(["Júnior1", "Júnior2", "Pleno1"])
    expect(g.maturidades).toEqual([{ maturidade: "Júnior", colunas: 2 }, { maturidade: "Pleno", colunas: 1 }])
  })

  it("cargos na ordem da planilha, com null onde o cargo não tem o nível", () => {
    const [g] = montarGrades([
      linha({ cargo: "QA", ordemCargo: 2, ordemNivel: 1, valor: 10 }),
      linha({ cargo: "Backend", ordemCargo: 1, ordemNivel: 1, valor: 20 }),
      linha({ cargo: "Backend", ordemCargo: 1, maturidade: "Pleno", nivel: 1, ordemNivel: 4, valor: 30 }),
    ])
    expect(g.cargos).toEqual([
      { cargo: "Backend", valores: [20, 30] },
      { cargo: "QA", valores: [10, null] },
    ])
  })
})

import { describe, it, expect } from "vitest"
import { custoHora, precoPara, tetoHoras, resultado, opexMedio, opexPorMes, type Premissas, type LinhaRealizado } from "@/lib/services/precificacao-service"

const p: Premissas = { horasPessoaMes: 160, opexHora: 23.92, impostosFaturamento: 0.1175, comissoes: 0, margemAlvo: 0.15, irCsll: 0.34 }

describe("precificação", () => {
  it("custo da hora = salário ÷ horas + OPEX por hora", () => {
    const c = custoHora(24067.03, p)
    expect(c.pessoa).toBeCloseTo(150.42, 2)
    expect(c.total).toBeCloseTo(174.34, 2)
  })

  it("reproduz a planilha antiga: lucro de 14,71% sobre o preço dá R$ 237,06/h", () => {
    const { total } = custoHora(24067.03, p)
    expect(precoPara(total, p, 0.1470833)).toBeCloseTo(237.06, 1)
  })

  it("preço é null quando impostos + comissões + margem chegam a 100%", () => {
    expect(precoPara(100, { ...p, comissoes: 0.5 }, 0.4)).toBeNull()
  })

  it("teto de horas: empate e com margem", () => {
    // R$ 3.000, custo R$ 100/h: empate = 3000 × 0,8825 / 100 = 26,475h
    expect(tetoHoras(3000, 100, p, 0)).toBeCloseTo(26.475, 3)
    expect(tetoHoras(3000, 100, p, 0.15)).toBeCloseTo(21.975, 3)
  })

  it("resultado desconta IRPJ/CSLL só do lucro positivo", () => {
    const r = resultado(1000, 600, 100, p)
    expect(r.impostos).toBeCloseTo(117.5)
    expect(r.lucroAntesIr).toBeCloseTo(182.5)
    expect(r.irCsll).toBeCloseTo(62.05)
    expect(r.margemLiquida).toBeCloseTo(0.12045, 4)
    const prejuizo = resultado(500, 600, 100, p)
    expect(prejuizo.irCsll).toBe(0)
    expect(prejuizo.lucroLiquido).toBeLessThan(0)
  })

  it("OPEX médio usa os últimos meses com lançamento", () => {
    const serie = [
      { mes: 1, valor: 100 }, { mes: 2, valor: 200 }, { mes: 3, valor: 300 }, { mes: 4, valor: 400 }, { mes: 5, valor: null },
    ]
    expect(opexMedio(serie, 3)).toEqual({ media: 300, mesesUsados: [2, 3, 4] })
    expect(opexMedio([{ mes: 1, valor: null }], 3)).toBeNull()
  })

  it("OPEX do mês: Despesas − financiamentos − Laura + pró-labore e lucros de Feliciano e Larissa", () => {
    const g = (codigo: string, realizado: number | null, mes = 9): LinhaRealizado => ({ codigo, codigoPai: "", nome: codigo, isGrupo: true, mes, realizado })
    const i = (pai: string, nome: string, realizado: number, mes = 9): LinhaRealizado => ({ codigo: "", codigoPai: pai, nome, isGrupo: false, mes, realizado })
    const linhas = [
      g("30000", 16000), g("34100", 500),
      i("31200", "Laura Pillon", 4000), i("31200", "Suélen Ferreira", 5000),
      i("20200", "Feliciano de Vargas", 1400), i("20200", "Larissa Bittencourt", 1400), i("20200", "Guilherme Rohr", 1400),
      i("41000", "Feliciano de Vargas", 3300), i("41000", "Larissa Bittencourt", 4900), i("41000", "Guilherme Rohr", 15000),
      g("30000", null, 10),
    ]
    const serie = opexPorMes(linhas)
    expect(serie.find((s) => s.mes === 9)?.valor).toBe(16000 - 500 - 4000 + 1400 + 1400 + 3300 + 4900)
    expect(serie.find((s) => s.mes === 10)?.valor).toBeNull()
  })
})

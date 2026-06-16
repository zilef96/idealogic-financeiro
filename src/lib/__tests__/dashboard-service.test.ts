import { describe, it, expect } from "vitest"
import {
  construirTotais, competenciaRef, serieOrcadoRealizado, serieSuperavit, serieMargem,
  serieCustoHora, serieCaixa, serieTributos, type LinhaDash,
} from "@/lib/services/dashboard-service"

// Helper: cria linhas para um único mês. `vals` mapeia codigo→{orcado,realizado}.
function linhas(mes: number, vals: Record<string, { o: number; r: number | null; grupo?: boolean; pai?: string }>): LinhaDash[] {
  return Object.entries(vals).map(([codigo, v]) => ({
    codigo, codigoPai: v.pai ?? "", nome: codigo, isGrupo: v.grupo ?? true, mes,
    orcado: v.o, realizado: v.r,
  }))
}

describe("construirTotais", () => {
  const ls = linhas(1, {
    "10000": { o: 100, r: 90 }, "10100": { o: 10, r: 8 }, "10200": { o: 5, r: 4 },
    "20000": { o: 30, r: 25 }, "30000": { o: 20, r: 18 }, "40000": { o: 10, r: 9 },
    "31000": { o: 5, r: 4 }, "32000": { o: 3, r: 2 }, "33000": { o: 4, r: 3 }, "34000": { o: 2, r: 1 },
    "10204": { o: 1, r: 1, grupo: false },
  })
  it("monta TotaisMes do realizado", () => {
    const t = construirTotais(ls, "realizado", 1)
    expect(t.faturamento).toBe(90)
    expect(t.cotas).toBe(8)
    expect(t.tributosFat).toBe(4)
    expect(t.custosOperacionais).toBe(3)
    expect(t.despAdmFinComl).toBe(4 + 2 + 3 + 1)
    expect(t.tributacaoLucro).toBe(1)
  })
  it("usa 0 para realizado nulo", () => {
    const semR = linhas(2, { "10000": { o: 100, r: null } })
    expect(construirTotais(semR, "realizado", 2).faturamento).toBe(0)
  })
})

describe("competenciaRef", () => {
  it("retorna o maior mês com algum realizado não-nulo", () => {
    const ls = [
      ...linhas(1, { "10000": { o: 1, r: 1 } }),
      ...linhas(2, { "10000": { o: 1, r: 1 } }),
      ...linhas(3, { "10000": { o: 1, r: null } }),
    ]
    expect(competenciaRef(ls)).toBe(2)
  })
  it("retorna 0 quando não há realizado", () => {
    expect(competenciaRef(linhas(1, { "10000": { o: 1, r: null } }))).toBe(0)
  })
})

describe("serieOrcadoRealizado", () => {
  const ls = [
    ...linhas(1, { "10000": { o: 100, r: 120 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 } }),
    ...linhas(2, { "10000": { o: 100, r: null }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 } }),
  ]
  it("usa faturamento de serviços por mês, com desvio %", () => {
    const s = serieOrcadoRealizado(ls)
    expect(s).toHaveLength(12)
    expect(s[0]).toMatchObject({ mes: 1, orcado: 100, realizado: 120, pendente: false })
    expect(s[0].desvioPercentual).toBeCloseTo(20)
  })
  it("marca meses sem realizado como pendentes (realizado null)", () => {
    const s = serieOrcadoRealizado(ls)
    expect(s[1]).toMatchObject({ mes: 2, orcado: 100, realizado: null, pendente: true })
  })
})

describe("serieSuperavit", () => {
  // superavitMensal = fatServ + cotas - tributosFat - custos - despesas - dividendos
  const ls = [
    ...linhas(1, { "10000": { o: 100, r: 100 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 },
      "20000": { o: 0, r: 30 }, "30000": { o: 0, r: 20 }, "40000": { o: 0, r: 0 } }),
    ...linhas(2, { "10000": { o: 100, r: 100 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 },
      "20000": { o: 0, r: 10 }, "30000": { o: 0, r: 10 }, "40000": { o: 0, r: 0 } }),
  ]
  it("calcula superávit do realizado e o acumulado", () => {
    const s = serieSuperavit(ls)
    expect(s[0]).toMatchObject({ mes: 1, superavit: 50, pendente: false })
    expect(s[1].superavit).toBe(80)
    expect(s[0].acumulado).toBe(50)
    expect(s[1].acumulado).toBe(130)
  })
  it("não acumula meses pendentes", () => {
    const s = serieSuperavit(linhas(3, { "10000": { o: 100, r: null } }))
    expect(s[2]).toMatchObject({ mes: 3, superavit: null, acumulado: null, pendente: true })
  })
})

describe("serieMargem", () => {
  // fatServ=100, superavit=50 → margem 50%
  const ls = linhas(1, { "10000": { o: 100, r: 100 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 },
    "20000": { o: 0, r: 30 }, "30000": { o: 0, r: 20 }, "40000": { o: 0, r: 0 } })
  it("calcula margem % do realizado", () => {
    const s = serieMargem(ls)
    expect(s[0]).toMatchObject({ mes: 1, pendente: false })
    expect(s[0].margem).toBeCloseTo(50)
  })
  it("margem null quando pendente", () => {
    expect(serieMargem(linhas(2, { "10000": { o: 100, r: null } }))[1]).toMatchObject({ margem: null, pendente: true })
  })
})

describe("serieCustoHora", () => {
  // custosOperacionais(33000)=400; despAdm=31000+32000+33000+34000 = 100+0+400+0=500
  // custoHora = (400+500)/100 = 9
  const ls = linhas(1, { "10000": { o: 0, r: 1 }, "31000": { o: 0, r: 100 }, "33000": { o: 0, r: 400 } })
  const horas = { horas_faturaveis: [{ mes: 1, valor: 100 }] }
  it("calcula custo hora do realizado usando horas vigentes", () => {
    const s = serieCustoHora(ls, horas, 3200)
    expect(s[0]).toMatchObject({ mes: 1, horas: 100, pendente: false })
    expect(s[0].custoHora).toBeCloseTo(9)
  })
  it("usa padrão de horas quando não há série e marca pendente sem realizado", () => {
    const s = serieCustoHora(linhas(2, { "10000": { o: 0, r: null } }), {}, 3200)
    expect(s[1]).toMatchObject({ mes: 2, horas: 3200, custoHora: null, pendente: true })
  })
})

describe("serieCaixa", () => {
  // mês 1 realizado superávit 50; mês 2 sem realizado → usa orçado superávit 20
  const ls = [
    ...linhas(1, { "10000": { o: 100, r: 100 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 },
      "20000": { o: 0, r: 30 }, "30000": { o: 0, r: 20 }, "40000": { o: 0, r: 0 } }),
    ...linhas(2, { "10000": { o: 100, r: null }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 },
      "20000": { o: 80, r: null }, "30000": { o: 0, r: null }, "40000": { o: 0, r: null } }),
  ]
  const tesouraria: { mes: number; tipo: "aplicacao" | "resgate"; valor: number }[] = []
  it("acumula saldo a partir do inicial e marca projeção", () => {
    const { pontos, caixaMinimo } = serieCaixa(ls, tesouraria, 1000, 500)
    expect(pontos[0]).toMatchObject({ mes: 1, saldo: 1050, projetado: false })
    expect(pontos[1]).toMatchObject({ mes: 2, saldo: 1070, projetado: true }) // 1050 + orçado 20
    expect(caixaMinimo).toBe(500)
  })
})

describe("serieTributos", () => {
  const ls = linhas(1, {
    "10000": { o: 1000, r: 1000 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 },
    "10201": { o: 0, r: 16.5, grupo: false }, "10202": { o: 0, r: 76, grupo: false }, "10203": { o: 0, r: 25, grupo: false },
  })
  it("soma os três tributos e calcula carga % sobre faturamento de serviços", () => {
    const s = serieTributos(ls)
    expect(s[0]).toMatchObject({ mes: 1, pis: 16.5, cofins: 76, issqn: 25, pendente: false })
    expect(s[0].cargaPercentual).toBeCloseTo((117.5 / 1000) * 100)
  })
  it("zera/nula quando pendente", () => {
    expect(serieTributos(linhas(2, { "10000": { o: 1, r: null } }))[1]).toMatchObject({ pis: null, cargaPercentual: null, pendente: true })
  })
})

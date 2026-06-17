import { describe, it, expect } from "vitest"
import {
  construirTotais, competenciaRef, serieOrcadoRealizado, serieSuperavit, serieMargem,
  serieCustoHora, serieCaixa, serieTributos, arvoreCategorias, topDespesas, paretoClientes,
  montarKpis, montarAlertas, montarDashboard, totaisAcumulados, desvioPorCategoria,
  type LinhaDash,
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
    // mês 2 pendente: na realidade TODAS as linhas têm realizado null (espelha vw_execucao_mensal)
    ...linhas(2, { "10000": { o: 100, r: null }, "10100": { o: 0, r: null }, "10200": { o: 0, r: null } }),
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
    ...linhas(2, { "10000": { o: 100, r: null }, "10100": { o: 0, r: null }, "10200": { o: 0, r: null },
      "20000": { o: 80, r: null }, "30000": { o: 0, r: null }, "40000": { o: 0, r: null } }),
  ]
  const tesouraria: { mes: number; tipo: "aplicacao" | "resgate"; valor: number }[] = []
  it("1º mês = caixa inicial; demais acumulam superávit e marcam projeção", () => {
    const { pontos, caixaMinimo } = serieCaixa(ls, tesouraria, 1000, 500)
    expect(pontos[0]).toMatchObject({ mes: 1, saldo: 1000, projetado: false }) // 1º mês = caixa inicial
    expect(pontos[1]).toMatchObject({ mes: 2, saldo: 1020, projetado: true })  // 1000 + orçado 20
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

describe("arvoreCategorias", () => {
  const ls = [
    ...linhas(1, {
      "30000": { o: 0, r: 0, pai: "" }, "31000": { o: 0, r: 0, pai: "30000" },
      "31100": { o: 0, r: 30, grupo: false, pai: "31000" }, "31200": { o: 0, r: 20, grupo: false, pai: "31000" },
    }),
    ...linhas(2, { "31100": { o: 0, r: 10, grupo: false, pai: "31000" } }),
  ]
  it("acumula realizado no ano e aninha por codigoPai com tipo derivado", () => {
    const arv = arvoreCategorias(ls)
    const bloco = arv.find((n) => n.codigo === "30000")!
    expect(bloco.tipo).toBe("D")
    expect(bloco.valor).toBe(60) // 30+20+10
    const grupo = bloco.filhos.find((n) => n.codigo === "31000")!
    expect(grupo.filhos.map((f) => f.codigo).sort()).toEqual(["31100", "31200"])
    expect(grupo.filhos.find((f) => f.codigo === "31100")!.valor).toBe(40)
  })
})

describe("topDespesas", () => {
  const ls = linhas(1, {
    "31100": { o: 0, r: 30, grupo: false, pai: "31000" }, "31200": { o: 0, r: 50, grupo: false, pai: "31000" },
    "21100": { o: 0, r: 90, grupo: false, pai: "21000" },
  })
  it("retorna só folhas de despesa (bloco 3), ordenadas desc, limitadas a n", () => {
    const top = topDespesas(ls, 1)
    expect(top).toEqual([{ nome: "31200", valor: 50 }])
  })
})

describe("paretoClientes", () => {
  it("calcula percentual individual e acumulado, ordenado desc", () => {
    const p = paretoClientes([
      { codigo: "a", nome: "A", realizado: 60, orcado: 0 },
      { codigo: "b", nome: "B", realizado: 30, orcado: 0 },
      { codigo: "c", nome: "C", realizado: 10, orcado: 0 },
    ])
    expect(p[0]).toMatchObject({ nome: "A", receita: 60, percentual: 60, acumulado: 60 })
    expect(p[1].acumulado).toBe(90)
    expect(p[2].acumulado).toBe(100)
  })
  it("lida com total zero sem dividir por zero", () => {
    const p = paretoClientes([{ codigo: "a", nome: "A", realizado: 0, orcado: 0 }])
    expect(p[0]).toMatchObject({ percentual: 0, acumulado: 0 })
  })
})

describe("montarKpis", () => {
  // ref = mês 1 (tem realizado). fatServ real=100, orçado=80 → delta vs orçado +25%
  const ls = linhas(1, { "10000": { o: 80, r: 100 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 },
    "20000": { o: 0, r: 30 }, "30000": { o: 0, r: 20 }, "40000": { o: 0, r: 0 } })
  it("gera o KPI de faturamento com delta vs orçado", () => {
    const kpis = montarKpis(ls, 1, { pontos: [{ mes: 1, saldo: 1000, projetado: false }], caixaMinimo: 500 } as never)
    const fat = kpis.find((k) => k.id === "faturamento")!
    expect(fat.valor).toBe(100)
    const dOrc = fat.deltas.find((d) => d.rotulo.includes("orçado"))!
    expect(dOrc.valor).toBeCloseTo(25)
  })
})

describe("montarAlertas", () => {
  it("emite alerta crítico quando o caixa fica abaixo do mínimo", () => {
    const caixa = { pontos: [{ mes: 1, saldo: 100, projetado: false }, { mes: 2, saldo: 400, projetado: true }], caixaMinimo: 500 } as never
    const a = montarAlertas(caixa, [])
    expect(a.some((x) => x.tipo === "caixa" && x.nivel === "critico")).toBe(true)
  })
  it("emite atenção quando o caixa tem pouca folga (sem romper o mínimo)", () => {
    const caixa = { pontos: [{ mes: 3, saldo: 540, projetado: false }], caixaMinimo: 500 } as never // folga 8% < 20%
    const a = montarAlertas(caixa, [])
    expect(a.some((x) => x.tipo === "caixa" && x.nivel === "atencao")).toBe(true)
  })
  it("emite atenção quando a margem fica abaixo da meta (ainda positiva)", () => {
    const caixa = { pontos: [{ mes: 1, saldo: 9999, projetado: false }], caixaMinimo: 500 } as never
    const margem = [{ mes: 1, margem: 8, pendente: false }] as never
    const a = montarAlertas(caixa, margem)
    expect(a.some((x) => x.tipo === "margem" && x.nivel === "atencao")).toBe(true)
  })
  it("emite atenção de desvio quando um grupo estoura a tolerância", () => {
    const caixa = { pontos: [{ mes: 1, saldo: 9999, projetado: false }], caixaMinimo: 500 } as never
    const desvio = [{ codigo: "31000", nome: "Pessoal", orcado: 100, realizado: 130, desvioPercentual: 30 }]
    const a = montarAlertas(caixa, [], desvio)
    expect(a.some((x) => x.tipo === "desvio" && x.mensagem.includes("Pessoal"))).toBe(true)
  })
  it("não alerta quando tudo está saudável", () => {
    const caixa = { pontos: [{ mes: 1, saldo: 9999, projetado: false }], caixaMinimo: 500 } as never
    const margem = [{ mes: 1, margem: 40, pendente: false }] as never
    expect(montarAlertas(caixa, margem, [])).toHaveLength(0)
  })
})

describe("montarDashboard", () => {
  const ls = linhas(1, { "10000": { o: 80, r: 100 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 },
    "20000": { o: 0, r: 30 }, "30000": { o: 0, r: 20 }, "40000": { o: 0, r: 0 } })
  it("monta o payload completo com a competência de referência", () => {
    const p = montarDashboard({
      ano: 2026, linhas: ls, series: {}, tesouraria: [],
      receitaClientes: [{ codigo: "a", nome: "A", realizado: 100, orcado: 80 }],
      saldoInicial: 1000, caixaMinimo: 500, horasPadrao: 3200,
    })
    expect(p.ano).toBe(2026)
    expect(p.competenciaRef).toBe(1)
    expect(p.kpis.length).toBe(6)
    expect(p.orcadoRealizado).toHaveLength(12)
    expect(p.concentracaoClientes[0].nome).toBe("A")
  })
})

describe("totaisAcumulados (YTD)", () => {
  const ls = [
    ...linhas(1, { "10000": { o: 80, r: 100 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 } }),
    ...linhas(2, { "10000": { o: 80, r: 60 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 } }),
  ]
  it("soma os totais de janeiro até o mês informado", () => {
    const t = totaisAcumulados(ls, "realizado", 2)
    expect(t.faturamento).toBe(160) // 100 + 60
    const tOrc = totaisAcumulados(ls, "orcado", 2)
    expect(tOrc.faturamento).toBe(160) // 80 + 80
  })
})

describe("montarKpis (YTD)", () => {
  const ls = [
    ...linhas(1, { "10000": { o: 80, r: 100 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 },
      "20000": { o: 0, r: 30 }, "30000": { o: 0, r: 20 }, "40000": { o: 0, r: 0 } }),
    ...linhas(2, { "10000": { o: 80, r: 60 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 },
      "20000": { o: 0, r: 10 }, "30000": { o: 0, r: 10 }, "40000": { o: 0, r: 0 } }),
  ]
  const caixa = { pontos: [{ mes: 1, saldo: 1000, projetado: false }, { mes: 2, saldo: 1100, projetado: false }], caixaMinimo: 500 } as never
  it("acumula faturamento do ano até a competência de referência", () => {
    const kpis = montarKpis(ls, 2, caixa)
    const fat = kpis.find((k) => k.id === "faturamento")!
    expect(fat.valor).toBe(160) // 100 + 60 YTD
    const dOrc = fat.deltas.find((d) => d.rotulo.includes("orçado"))!
    expect(dOrc.valor).toBeCloseTo(0) // 160 vs orçado 160 → 0%
  })
})

describe("desvioPorCategoria", () => {
  const ls = linhas(1, {
    "30000": { o: 0, r: 0, pai: "" },
    "31000": { o: 100, r: 120, pai: "30000" },
    "32000": { o: 50, r: 40, pai: "30000" },
  })
  it("compara orçado×realizado YTD por grupo, com desvio % com sinal", () => {
    const d = desvioPorCategoria(ls)
    expect(d.map((x) => x.codigo).sort()).toEqual(["31000", "32000"])
    expect(d.find((x) => x.codigo === "31000")!.desvioPercentual).toBeCloseTo(20)
    expect(d.find((x) => x.codigo === "32000")!.desvioPercentual).toBeCloseTo(-20)
  })
})

describe("montarKpis (mês selecionado)", () => {
  const ls = [
    ...linhas(1, { "10000": { o: 80, r: 100 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 } }),
    ...linhas(2, { "10000": { o: 80, r: 60 }, "10100": { o: 0, r: 0 }, "10200": { o: 0, r: 0 } }),
  ]
  const caixa = { pontos: [{ mes: 1, saldo: 1000, projetado: false }, { mes: 2, saldo: 900, projetado: false }], caixaMinimo: 500 } as never
  it("usa só o mês escolhido (não acumula) e expõe a referência orçada", () => {
    const kpis = montarKpis(ls, 2, caixa, 2)
    const fat = kpis.find((k) => k.id === "faturamento")!
    expect(fat.valor).toBe(60)         // só o mês 2
    expect(fat.referencia).toBe(80)    // orçado do mês 2
    expect(fat.deltas.find((d) => d.rotulo.includes("mês ant."))!.valor).toBeCloseTo(-40) // 60 vs 100
  })
})

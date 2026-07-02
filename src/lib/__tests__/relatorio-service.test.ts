import { describe, it, expect } from "vitest"
import { receitaLiquida, margemBruta, demonstrativoCustos, demonstrativoDespesas, saldosBancarios, serieFluxoMensal, montarRelatorio } from "@/lib/services/relatorio-service"
import type { TotaisMes, LinhaDash, SeriesParametros } from "@/lib/services/dashboard-service"

function totais(p: Partial<TotaisMes> = {}): TotaisMes {
  return {
    faturamento: 0, cotas: 0, tributosFat: 0, tributacaoLucro: 0,
    custos: 0, despesas: 0, dividendos: 0, custosOperacionais: 0, despAdmFinComl: 0,
    ...p,
  }
}

// Linhas de grupo por mês (grupos têm código; realizado pode ser null).
function grupos(mes: number, vals: Record<string, number | null>): LinhaDash[] {
  return Object.entries(vals).map(([codigo, r]) => ({
    codigo, codigoPai: "", nome: codigo, isGrupo: true, itemId: null,
    mes, orcado: 0, realizado: r,
  }))
}

// Linhas mistas (grupos + itens) para um mês. Itens (grupo:false) não têm código;
// ganham itemId derivado do rótulo e codigo vazio (espelha o helper do dashboard-service.test).
function linhas(mes: number, vals: Record<string, { o: number; r: number | null; grupo?: boolean; pai?: string }>): LinhaDash[] {
  return Object.entries(vals).map(([codigo, v]) => ({
    codigo: v.grupo === false ? "" : codigo,
    codigoPai: v.pai ?? "",
    nome: codigo,
    isGrupo: v.grupo ?? true,
    itemId: v.grupo === false ? (Number.isNaN(Number(codigo)) ? 0 : Number(codigo)) : null,
    mes,
    orcado: v.o, realizado: v.r,
  }))
}

describe("receitaLiquida", () => {
  it("Total de Receitas − (PIS+COFINS+ISSQN), sem subtrair 10204", () => {
    // faturamento(10000)=120 inclui cotas(10)+tributosFat(20); fatServiços=90.
    // Total Receitas = 90 + 10 = 100. Tributos 3 itens = tributosFat(20) − 10204(5) = 15.
    const t = totais({ faturamento: 120, cotas: 10, tributosFat: 20, tributacaoLucro: 5 })
    expect(receitaLiquida(t)).toBe(100 - 15)
  })
})

describe("margemBruta", () => {
  it("(receitaLiquida − custos) / receitaLiquida × 100", () => {
    expect(margemBruta(200, 50)).toBeCloseTo(75)
  })
  it("null quando receita líquida é zero", () => {
    expect(margemBruta(0, 10)).toBeNull()
  })
})

describe("demonstrativoCustos", () => {
  it("soma remuneração (20100+20200+20300), 20400, 20500 e usa 20000 como total", () => {
    const ls = grupos(5, {
      "20000": 300, "20100": 100, "20200": 50, "20300": 30,
      "20400": 70, "20500": 50,
    })
    const d = demonstrativoCustos(ls, 5)
    expect(d.remuneracao).toBe(180)
    expect(d.tributosEncargosProvisoes).toBe(70)
    expect(d.beneficios).toBe(50)
    expect(d.total).toBe(300)
  })
  it("grupo ausente ou realizado nulo conta como 0", () => {
    const ls = grupos(5, { "20000": null })
    expect(demonstrativoCustos(ls, 5).total).toBe(0)
  })
})

describe("demonstrativoDespesas", () => {
  it("mapeia cada subgrupo de 30000 e usa 30000 como total", () => {
    const ls = grupos(5, {
      "30000": 1000, "31000": 300, "32000": 100,
      "33000": 200, "33100": 90, "33200": 70, "33300": 40,
      "34000": 50, "35100": 120, "35200": 80, "36000": 150,
    })
    const d = demonstrativoDespesas(ls, 5)
    expect(d.remuneracao).toBe(300)
    expect(d.culturaPessoas).toBe(100)
    expect(d.custosOperacionais).toBe(200)
    expect(d.cloud).toBe(90)
    expect(d.saas).toBe(70)
    expect(d.assessorias).toBe(40)
    expect(d.despesasFinanceiras).toBe(50)
    expect(d.marketingSocial).toBe(120)
    expect(d.marketingComercial).toBe(80)
    expect(d.espacoGauten).toBe(150)
    expect(d.total).toBe(1000)
  })
})

describe("saldosBancarios", () => {
  const series: SeriesParametros = {
    saldo_sicredi_cc: [{ mes: 5, valor: 1000 }],
    saldo_sicredi_aplicacao: [{ mes: 5, valor: 2000 }],
    saldo_banrisul_cc: [{ mes: 5, valor: 500 }, { mes: 4, valor: 999 }],
  }
  it("soma os 3 saldos do mês (saldo geral)", () => {
    const s = saldosBancarios(series, 5)
    expect(s.sicrediCc).toBe(1000)
    expect(s.sicrediAplicacao).toBe(2000)
    expect(s.banrisulCc).toBe(500)
    expect(s.saldoGeral).toBe(3500)
  })
  it("chave ausente no mês conta como 0", () => {
    const s = saldosBancarios(series, 6)
    expect(s.saldoGeral).toBe(0)
    expect(s.sicrediCc).toBe(0)
  })
})

describe("serieFluxoMensal", () => {
  // Mês 1 com realizado; mês 2 sem realizado (todos null).
  const ls = [
    ...linhas(1, {
      "10000": { o: 0, r: 120 }, "10100": { o: 0, r: 10 }, "10200": { o: 0, r: 20 },
      "20000": { o: 0, r: 40 }, "30000": { o: 0, r: 30 }, "40000": { o: 0, r: 5 },
      "CSLL e IRPJ": { o: 0, r: 5, grupo: false, pai: "10200" },
    }),
    ...linhas(2, { "10000": { o: 0, r: null } }),
  ]
  const f = serieFluxoMensal(ls)

  it("tem 12 linhas de mês", () => {
    expect(f.meses).toHaveLength(12)
  })
  it("calcula as colunas do mês 1", () => {
    const m1 = f.meses[0]
    // fatServiços = 120 − 10 − 20 = 90; tributos 3 itens = 20 − 5 = 15;
    // resultado = superavitMensal = 90 + 10 − 20 − 40 − 30 − 5 = 5
    expect(m1.receitas).toBe(90)
    expect(m1.cotas).toBe(10)
    expect(m1.tributos).toBe(15)
    expect(m1.custos).toBe(40)
    expect(m1.despesas).toBe(30)
    expect(m1.dividendos).toBe(5)
    expect(m1.resultado).toBe(5)
  })
  it("mês sem realizado zera na tabela", () => {
    expect(f.meses[1].receitas).toBe(0)
    expect(f.meses[1].resultado).toBe(0)
  })
  it("TOTAL soma as 12 competências", () => {
    expect(f.total.receitas).toBe(90)
    expect(f.total.resultado).toBe(5)
  })
  it("gráfico traz valores até a competência de referência (mês 1) e null depois", () => {
    expect(f.grafico[0].receitas).toBe(90)
    expect(f.grafico[1].receitas).toBeNull()
    expect(f.grafico[11].receitas).toBeNull()
  })
})

describe("montarRelatorio", () => {
  const ls = linhas(5, {
    "10000": { o: 0, r: 120 }, "10100": { o: 0, r: 10 }, "10200": { o: 0, r: 20 },
    "20000": { o: 0, r: 40 }, "30000": { o: 0, r: 30 }, "40000": { o: 0, r: 5 },
    "PIS": { o: 0, r: 3, grupo: false, pai: "10200" },
    "COFINS": { o: 0, r: 7, grupo: false, pai: "10200" },
    "ISSQN": { o: 0, r: 5, grupo: false, pai: "10200" },
    "CSLL e IRPJ": { o: 0, r: 5, grupo: false, pai: "10200" },
  })
  const p = montarRelatorio({ ano: 2026, mes: 5, linhas: ls, series: {}, status: "aberto" })

  it("preenche cabeçalho e receita", () => {
    expect(p.ano).toBe(2026)
    expect(p.mes).toBe(5)
    expect(p.status).toBe("aberto")
    expect(p.faturamento).toBe(90)       // fatServiços
    expect(p.cotas).toBe(10)
    expect(p.totalReceitas).toBe(100)
    expect(p.pis).toBe(3)
    expect(p.cofins).toBe(7)
    expect(p.issqn).toBe(5)
    expect(p.receitaLiquida).toBe(100 - 15)  // − (tributosFat 20 − 10204 5)
  })
  it("calcula indicadores", () => {
    expect(p.resultadoOperacional).toBe(5)  // superavitMensal
    expect(p.margemLiquida).toBeCloseTo((5 / 85) * 100)
    expect(p.margemBruta).toBeCloseTo(((85 - 40) / 85) * 100)
  })
  it("inclui fluxo e saldos", () => {
    expect(p.fluxo.meses).toHaveLength(12)
    expect(p.saldos.saldoGeral).toBe(0)   // sem series
  })
})

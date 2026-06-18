import { describe, it, expect } from "vitest"
import { calcDesvio, margemContribuicao, custoHora, tributosSobreFaturamento, projecaoCaixa, valorVigente, superavitMensal, calcularIndicadoresMes, contarPendencias, naturezaPorCodigo, julgamentoDesvio, type TotaisMes } from "@/lib/services/execucao-service"

describe("calcDesvio", () => {
  it("desvio e percentual", () => {
    expect(calcDesvio(120, 100)).toEqual({ desvio: 20, desvioPercentual: 20 })
  })
  it("orçado zero → percentual nulo", () => {
    expect(calcDesvio(50, 0)).toEqual({ desvio: 50, desvioPercentual: null })
  })
})

describe("margemContribuicao", () => {
  it("superávit/faturamento em %", () => {
    expect(margemContribuicao(30, 100)).toBe(30)
  })
  it("faturamento zero → null", () => {
    expect(margemContribuicao(10, 0)).toBeNull()
  })
})

describe("custoHora", () => {
  it("(custos op + despesas adm) / horas", () => {
    expect(custoHora(20000, 6000, 3200)).toBeCloseTo(8.125)
  })
  it("horas zero → null", () => {
    expect(custoHora(1, 1, 0)).toBeNull()
  })
})

describe("tributosSobreFaturamento", () => {
  it("soma pis+cofins+issqn sobre receita realizada", () => {
    expect(tributosSobreFaturamento(10000, { pis: 0.0165, cofins: 0.076, issqn: 0.025 }))
      .toBeCloseTo(1175)
  })
})

describe("contarPendencias", () => {
  const linhas = [
    { isGrupo: true,  mes: 6, orcado: 100, realizado: null },  // grupo: ignorado
    { isGrupo: false, mes: 6, orcado: 100, realizado: null },  // pendente
    { isGrupo: false, mes: 6, orcado: 50,  realizado: 10 },    // preenchido
    { isGrupo: false, mes: 6, orcado: 0,   realizado: null },  // fora de vigência: ignorado
    { isGrupo: false, mes: 7, orcado: 100, realizado: null },  // outro mês: ignorado
  ]
  it("conta itens dentro da vigência sem realizado no mês", () => {
    expect(contarPendencias(linhas, 6)).toBe(1)
  })
})

describe("projecaoCaixa", () => {
  it("1º mês = caixa inicial; demais acumulam só o superávit", () => {
    const r = projecaoCaixa({
      saldoInicial: 1000,
      superavitPorMes: [500, 200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    })
    expect(r[0]).toBe(1000)   // 1º mês = caixa inicial (ignora superávit do mês)
    expect(r[1]).toBe(1200)   // 1000 + 200
    expect(r[2]).toBe(1200)   // sem mudança
  })
})

describe("valorVigente", () => {
  const serie = [{ mes: 1, valor: 0.0165 }, { mes: 4, valor: 0.02 }]
  it("usa o último valor com competência ≤ mês", () => {
    expect(valorVigente(serie, 3)).toBe(0.0165)
    expect(valorVigente(serie, 4)).toBe(0.02)
    expect(valorVigente(serie, 9)).toBe(0.02)
  })
  it("antes do primeiro valor → default", () => {
    expect(valorVigente([{ mes: 4, valor: 1.05 }], 2, 1)).toBe(1)
  })
  it("série vazia → default", () => {
    expect(valorVigente([], 6, 3200)).toBe(3200)
  })
})

// faturamento 120000 inclui cotas 10000 e tributos 10000 → fat. serviços = 100000
const baseTotais: TotaisMes = {
  faturamento: 120000, cotas: 10000, tributosFat: 10000, tributacaoLucro: 3000,
  custos: 30000, despesas: 20000, dividendos: 5000, custosOperacionais: 8000, despAdmFinComl: 16000,
}

describe("superavitMensal", () => {
  it("fatServiços + cotas − tributos − custos − despesas − distribuição", () => {
    // (120000-10000-10000) + 10000 - 10000 - 30000 - 20000 - 5000 = 45000
    expect(superavitMensal(baseTotais)).toBe(45000)
  })
})

const baseInput = {
  totais: baseTotais,
  parametros: { pis: 0.0165, cofins: 0.076, issqn: 0.025, horasFaturaveis: 3200, fatorReajuste: 1.05 },
  tesouraria: { aplicacoes: 0, resgates: 43618.55 },
  caixaDoMes: 150000,
  temRealizado: true,
}
const val = (lista: { rotulo: string; valor: number | null }[], rotulo: string) =>
  lista.find((i) => i.rotulo === rotulo)?.valor ?? null

describe("calcularIndicadoresMes", () => {
  it("calcula os indicadores principais", () => {
    const r = calcularIndicadoresMes(baseInput)
    expect(val(r, "Superávit/Déficit do mês")).toBe(45000)
    expect(val(r, "Tributação sobre lucro")).toBe(3000)
    expect(val(r, "Superávit/Déficit antes da tributação")).toBe(48000)
    expect(val(r, "Margem de contribuição")).toBe(45)            // 45000 / 100000
    expect(val(r, "Custo hora Idealogic")).toBeCloseTo(7.5)      // (8000+16000)/3200
    expect(val(r, "Custos operacionais (33000)")).toBe(8000)
    expect(val(r, "Horas faturáveis")).toBe(3200)
    expect(val(r, "Reajuste salarial")).toBe(1.05)
    expect(val(r, "Caixa")).toBe(150000)
    expect(val(r, "Resgate aplicação")).toBe(43618.55)
  })
  it("mês sem realizado → indicadores monetários pendentes, parâmetros mantidos", () => {
    const r = calcularIndicadoresMes({ ...baseInput, temRealizado: false })
    expect(val(r, "Superávit/Déficit do mês")).toBeNull()
    expect(r.find((i) => i.rotulo === "Superávit/Déficit do mês")?.pendente).toBe(true)
    expect(val(r, "Horas faturáveis")).toBe(3200)
  })
})

describe("naturezaPorCodigo", () => {
  it("deriva a natureza do primeiro dígito", () => {
    expect(naturezaPorCodigo("10000")).toBe("R")
    expect(naturezaPorCodigo("20000")).toBe("C")
    expect(naturezaPorCodigo("30000")).toBe("D")
    expect(naturezaPorCodigo("40000")).toBe("E")
  })
})

describe("julgamentoDesvio", () => {
  it("receita acima do orçado é bom; abaixo é ruim", () => {
    expect(julgamentoDesvio("10000", 50)).toBe("bom")
    expect(julgamentoDesvio("10000", -50)).toBe("ruim")
  })
  it("custo/despesa acima do orçado é ruim; abaixo (economia) é bom", () => {
    expect(julgamentoDesvio("20000", 50)).toBe("ruim")
    expect(julgamentoDesvio("30000", -50)).toBe("bom")
  })
  it("distribuição e desvio zero são neutros", () => {
    expect(julgamentoDesvio("40000", 50)).toBe("neutro")
    expect(julgamentoDesvio("30000", 0)).toBe("neutro")
  })
})

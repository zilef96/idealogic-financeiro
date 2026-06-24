import { describe, it, expect } from "vitest"
import { planejarCopiaGrupos, BLOCOS_BASE, type GrupoCopia } from "@/lib/services/periodo-service"

describe("planejarCopiaGrupos", () => {
  it("mantém raízes (paiCodigo null) e põe filho depois do pai", () => {
    const entrada: GrupoCopia[] = [
      { codigo: 10010, paiCodigo: 10000, tipoContaId: 1, nome: "Sub" },
      { codigo: 10000, paiCodigo: null, tipoContaId: 1, nome: "Raiz" },
    ]
    const ordem = planejarCopiaGrupos(entrada).map((g) => g.codigo)
    expect(ordem.indexOf(10000)).toBeLessThan(ordem.indexOf(10010))
  })

  it("ordena subgrupo de subgrupo (neto depois de pai e avô)", () => {
    const entrada: GrupoCopia[] = [
      { codigo: 31100, paiCodigo: 31000, tipoContaId: 3, nome: "Neto" },
      { codigo: 31000, paiCodigo: 30000, tipoContaId: 3, nome: "Filho" },
      { codigo: 30000, paiCodigo: null, tipoContaId: 3, nome: "Avô" },
    ]
    const ordem = planejarCopiaGrupos(entrada).map((g) => g.codigo)
    expect(ordem.indexOf(30000)).toBeLessThan(ordem.indexOf(31000))
    expect(ordem.indexOf(31000)).toBeLessThan(ordem.indexOf(31100))
  })

  it("reordena entrada fora de ordem e preserva paiCodigo", () => {
    const entrada: GrupoCopia[] = [
      { codigo: 20400, paiCodigo: 20000, tipoContaId: 2, nome: "C" },
      { codigo: 20000, paiCodigo: null, tipoContaId: 2, nome: "A" },
    ]
    const saida = planejarCopiaGrupos(entrada)
    expect(saida).toHaveLength(2)
    expect(saida.find((g) => g.codigo === 20400)?.paiCodigo).toBe(20000)
  })

  it("preserva todos os grupos quando todos os pais existem", () => {
    const entrada: GrupoCopia[] = [
      { codigo: 10000, paiCodigo: null, tipoContaId: 1, nome: "R" },
      { codigo: 10010, paiCodigo: 10000, tipoContaId: 1, nome: "R1" },
      { codigo: 10020, paiCodigo: 10000, tipoContaId: 1, nome: "R2" },
    ]
    expect(planejarCopiaGrupos(entrada)).toHaveLength(3)
  })

  it("descarta órfão (paiCodigo ausente na lista) sem travar", () => {
    const entrada: GrupoCopia[] = [
      { codigo: 99999, paiCodigo: 88888, tipoContaId: 1, nome: "Órfão" },
      { codigo: 10000, paiCodigo: null, tipoContaId: 1, nome: "R" },
    ]
    const ordem = planejarCopiaGrupos(entrada).map((g) => g.codigo)
    expect(ordem).toEqual([10000])
  })
})

describe("BLOCOS_BASE", () => {
  it("tem os 4 blocos-raiz nas siglas R, C, D, E", () => {
    expect(BLOCOS_BASE.map((b) => b.sigla)).toEqual(["R", "C", "D", "E"])
  })
  it("usa os códigos do seed (10000/20000/30000/40000)", () => {
    expect(BLOCOS_BASE.map((b) => b.codigo)).toEqual([10000, 20000, 30000, 40000])
  })
})

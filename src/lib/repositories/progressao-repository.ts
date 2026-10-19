import { prisma } from "@/lib/prisma"
import type { LinhaProgressao, Regime, Trilha } from "@/lib/services/progressao-service"

export async function getProgressao(ano: number): Promise<LinhaProgressao[]> {
  const rows = await prisma.progressao_salarial.findMany({
    where: { ano },
    orderBy: [{ trilha: "asc" }, { regime: "asc" }, { ordem_cargo: "asc" }, { ordem_nivel: "asc" }],
  })
  return rows.map((r) => ({
    trilha: r.trilha as Trilha,
    regime: r.regime as Regime,
    cargo: r.cargo,
    ordemCargo: r.ordem_cargo,
    maturidade: r.maturidade,
    nivel: r.nivel,
    ordemNivel: r.ordem_nivel,
    valor: Number(r.valor),
  }))
}

// Anos com tabela cadastrada, do mais recente pro mais antigo.
export async function getAnosProgressao(): Promise<number[]> {
  const rows = await prisma.progressao_salarial.findMany({ distinct: ["ano"], select: { ano: true }, orderBy: { ano: "desc" } })
  return rows.map((r) => r.ano)
}

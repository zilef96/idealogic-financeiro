import { prisma } from "@/lib/prisma"

export interface ReceitaCliente {
  codigo: string
  nome: string
  realizado: number
  orcado: number
}

interface Row { codigo: string; nome: string; realizado: unknown; orcado: unknown }

// Receita realizada/orçada acumulada no ano, por item-cliente (folhas de 10010–10099,
// fora Cotas 10100 e Tributos 10200). Soma todos os meses do exercício.
export async function getReceitaPorCliente(ano: number): Promise<ReceitaCliente[]> {
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT ci.codigo::text AS codigo, ci.nome AS nome,
           COALESCE(SUM(lr.valor_realizado), 0) AS realizado,
           COALESCE(SUM(lr.valor_orcado), 0)    AS orcado
    FROM conta_item ci
    JOIN conta_grupo g  ON g.id = ci.grupo_id
    JOIN exercicio e    ON e.id = g.exercicio_id
    LEFT JOIN lancamento_realizado lr ON lr.conta_item_id = ci.id
    WHERE e.ano = ${ano}
      AND g.codigo::int BETWEEN 10010 AND 10099
    GROUP BY ci.codigo, ci.nome
    HAVING COALESCE(SUM(lr.valor_realizado), 0) <> 0 OR COALESCE(SUM(lr.valor_orcado), 0) <> 0
    ORDER BY realizado DESC
  `
  return rows.map((r) => ({
    codigo: r.codigo, nome: r.nome,
    realizado: Number(r.realizado), orcado: Number(r.orcado),
  }))
}

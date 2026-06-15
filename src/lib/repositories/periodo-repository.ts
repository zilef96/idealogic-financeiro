import { prisma } from "@/lib/prisma"

export async function listarAnos(): Promise<number[]> {
  const rows = await prisma.$queryRaw<{ ano: number }[]>`SELECT ano FROM exercicio ORDER BY ano DESC`
  return rows.map((r) => r.ano)
}

// Cria novo exercício. Se copiarDe informado, duplica grupos (remapeando pai) e itens.
export async function criarPeriodo(ano: number, copiarDe: number | null): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const ex = await tx.$queryRaw<{ id: bigint }[]>`
      INSERT INTO exercicio (ano) VALUES (${ano}) RETURNING id`
    const novoId = ex[0].id

    if (copiarDe == null) return

    const orig = await tx.$queryRaw<{ id: bigint }[]>`SELECT id FROM exercicio WHERE ano = ${copiarDe}`
    if (!orig[0]) throw new Error(`Exercício de origem ${copiarDe} não existe.`)

    // grupos do exercício origem, em ordem topológica (pais antes dos filhos)
    const grupos = await tx.$queryRaw<{ id: bigint; codigo: number; pai_codigo: number | null; tipo_conta_id: number; nome: string }[]>`
      SELECT cg.id, cg.codigo::int AS codigo, pai.codigo::int AS pai_codigo, cg.tipo_conta_id, cg.nome
      FROM conta_grupo cg LEFT JOIN conta_grupo pai ON pai.id = cg.grupo_pai_id
      WHERE cg.exercicio_id = ${orig[0].id}
      ORDER BY cg.codigo::numeric`
    for (const g of grupos) {
      await tx.$executeRaw`
        INSERT INTO conta_grupo (exercicio_id, codigo, grupo_pai_id, tipo_conta_id, nome)
        VALUES (${novoId}, ${g.codigo},
          ${g.pai_codigo === null ? null : await (async () => {
            const r = await tx.$queryRaw<{ id: bigint }[]>`SELECT id FROM conta_grupo WHERE exercicio_id = ${novoId} AND codigo = ${g.pai_codigo}`
            return r[0].id
          })()},
          ${g.tipo_conta_id}, ${g.nome})`
    }
    // itens (copiando por código de grupo)
    await tx.$executeRaw`
      INSERT INTO conta_item (grupo_id, codigo, nome, periodicidade, valor_orcado, valor_orcado_mensal, classificacao, is_fixo, comentarios, mes_inicio, mes_fim)
      SELECT ng.id, ci.codigo, ci.nome, ci.periodicidade, ci.valor_orcado, ci.valor_orcado_mensal, ci.classificacao, ci.is_fixo, ci.comentarios, ci.mes_inicio, ci.mes_fim
      FROM conta_item ci
      JOIN conta_grupo og ON og.id = ci.grupo_id AND og.exercicio_id = ${orig[0].id}
      JOIN conta_grupo ng ON ng.exercicio_id = ${novoId} AND ng.codigo = og.codigo`
  })
}

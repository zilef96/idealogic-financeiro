import { prisma } from "@/lib/prisma"
import { planejarCopiaGrupos, BLOCOS_BASE, type GrupoCopia } from "@/lib/services/periodo-service"

export async function listarAnos(): Promise<number[]> {
  const rows = await prisma.$queryRaw<{ ano: number }[]>`SELECT ano FROM exercicio ORDER BY ano DESC`
  return rows.map((r) => r.ano)
}

// Cria novo exercício (sempre nasce em rascunho).
// copiarDe != null: duplica só o PLANO (origem='orcamento') de grupos e itens, remapeando pai por código.
// copiarDe == null: nasce com os 4 blocos-raiz (BLOCOS_BASE).
export async function criarPeriodo(
  ano: number,
  copiarDe: number | null,
): Promise<{ ano: number; status: "rascunho" }> {
  // G1: ano duplicado vira sentinela (mapeada para 409), não 23505 cru.
  const existe = await prisma.$queryRaw<{ id: bigint }[]>`SELECT id FROM exercicio WHERE ano = ${ano}`
  if (existe[0]) throw new Error("PERIODO_DUPLICADO")

  await prisma.$transaction(async (tx) => {
    const ex = await tx.$queryRaw<{ id: bigint }[]>`
      INSERT INTO exercicio (ano) VALUES (${ano}) RETURNING id`
    const novoId = ex[0].id

    // "Do zero": só os 4 blocos-raiz, tipo resolvido por sigla, origem='orcamento'.
    if (copiarDe == null) {
      for (const b of BLOCOS_BASE) {
        await tx.$executeRaw`
          INSERT INTO conta_grupo (exercicio_id, codigo, grupo_pai_id, tipo_conta_id, nome, origem)
          SELECT ${novoId}, ${b.codigo}, NULL,
            (SELECT id FROM tipo_conta WHERE sigla = ${b.sigla}), ${b.nome}, 'orcamento'`
      }
      return
    }

    // Cópia: G2 — origem inexistente vira sentinela (mapeada para 422).
    const orig = await tx.$queryRaw<{ id: bigint }[]>`SELECT id FROM exercicio WHERE ano = ${copiarDe}`
    if (!orig[0]) throw new Error("ORIGEM_INEXISTENTE")

    // Grupos do plano (origem='orcamento') ordenados topologicamente (pais antes dos filhos).
    const grupos = await tx.$queryRaw<{ codigo: number; pai_codigo: number | null; tipo_conta_id: number; nome: string }[]>`
      SELECT cg.codigo::int AS codigo, pai.codigo::int AS pai_codigo, cg.tipo_conta_id, cg.nome
      FROM conta_grupo cg LEFT JOIN conta_grupo pai ON pai.id = cg.grupo_pai_id
      WHERE cg.exercicio_id = ${orig[0].id} AND cg.origem = 'orcamento'`

    const ordenados = planejarCopiaGrupos(
      grupos.map<GrupoCopia>((g) => ({
        codigo: g.codigo, paiCodigo: g.pai_codigo, tipoContaId: g.tipo_conta_id, nome: g.nome,
      })),
    )
    for (const g of ordenados) {
      await tx.$executeRaw`
        INSERT INTO conta_grupo (exercicio_id, codigo, grupo_pai_id, tipo_conta_id, nome, origem)
        VALUES (${novoId}, ${g.codigo},
          ${g.paiCodigo === null ? null : await (async () => {
            const r = await tx.$queryRaw<{ id: bigint }[]>`SELECT id FROM conta_grupo WHERE exercicio_id = ${novoId} AND codigo = ${g.paiCodigo}`
            return r[0].id
          })()},
          ${g.tipoContaId}, ${g.nome}, 'orcamento')`
    }

    // Itens do plano (origem='orcamento'), join por código de grupo. Não copia Execução.
    await tx.$executeRaw`
      INSERT INTO conta_item (grupo_id, nome, periodicidade, valor_orcado, valor_orcado_mensal, classificacao, is_fixo, comentarios, mes_inicio, mes_fim, origem)
      SELECT ng.id, ci.nome, ci.periodicidade, ci.valor_orcado, ci.valor_orcado_mensal, ci.classificacao, ci.is_fixo, ci.comentarios, ci.mes_inicio, ci.mes_fim, 'orcamento'
      FROM conta_item ci
      JOIN conta_grupo og ON og.id = ci.grupo_id AND og.exercicio_id = ${orig[0].id}
      JOIN conta_grupo ng ON ng.exercicio_id = ${novoId} AND ng.codigo = og.codigo
      WHERE ci.origem = 'orcamento'`
  })

  return { ano, status: "rascunho" }
}

export type StatusExercicio = "rascunho" | "publicado"

export async function getStatusExercicio(ano: number): Promise<StatusExercicio> {
  const rows = await prisma.$queryRaw<{ status: string }[]>`
    SELECT status FROM exercicio WHERE ano = ${ano} LIMIT 1`
  return (rows[0]?.status as StatusExercicio) ?? "rascunho"
}

export async function publicarExercicio(ano: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`UPDATE exercicio SET status = 'publicado', updated_at = now() WHERE ano = ${ano}`

    // Evento único: materializa só na 1ª publicação. Em republicações, pula por inteiro
    // (nenhuma linha de execução é tocada — FC001 nunca dispara).
    const marca = await tx.$queryRaw<{ ja: boolean }[]>`
      SELECT (orcamento_materializado_em IS NOT NULL) AS ja FROM exercicio WHERE ano = ${ano}`
    if (marca[0]?.ja) return

    // Materializa o orçado nos 12 meses dos itens do plano (origem='orcamento').
    // A → valor_orcado_mensal em 1..12 (ignora vigência); M → em mes_inicio..mes_fim, 0 fora.
    await tx.$executeRaw`
      INSERT INTO lancamento_realizado (conta_item_id, exercicio_id, competencia, valor_orcado)
      SELECT ci.id,
             cg.exercicio_id,
             make_date(ex.ano, g.mes, 1),
             CASE
               WHEN ci.periodicidade = 'A' THEN ci.valor_orcado_mensal
               WHEN g.mes BETWEEN COALESCE(ci.mes_inicio, 1) AND COALESCE(ci.mes_fim, 12)
                    THEN ci.valor_orcado_mensal
               ELSE 0
             END
      FROM conta_item ci
      JOIN conta_grupo cg ON cg.id = ci.grupo_id
      JOIN exercicio   ex ON ex.id = cg.exercicio_id
      CROSS JOIN generate_series(1, 12) AS g(mes)
      WHERE ex.ano = ${ano}
        AND ci.origem = 'orcamento'
      ON CONFLICT (conta_item_id, competencia) DO NOTHING`

    await tx.$executeRaw`
      UPDATE exercicio SET orcamento_materializado_em = now()
       WHERE ano = ${ano} AND orcamento_materializado_em IS NULL`
  })
}

export async function despublicarExercicio(ano: number): Promise<void> {
  await prisma.$executeRaw`UPDATE exercicio SET status = 'rascunho', updated_at = now() WHERE ano = ${ano}`
}

// Guard de escrita: lança sentinela OR_PUBLICADO (mapeada para 409) se o ano estiver publicado.
export async function exigirRascunhoPorAno(ano: number): Promise<void> {
  if ((await getStatusExercicio(ano)) === "publicado") throw new Error("OR_PUBLICADO")
}

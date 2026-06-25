import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { normalizarOrcado, distribuirPorMes, vigenciaInvalidaPorFechamento } from "@/lib/services/orcamento-service"
import { exigirRascunhoPorAno } from "@/lib/repositories/periodo-repository"
import { getStatusTodos } from "@/lib/repositories/fechamento-repository"
import type {
  LinhaOrcamento, GrupoOrcamento, NovoItemInput, AtualizarItemInput, TipoConta,
} from "@/lib/types"

async function anoDoGrupo(grupoId: number): Promise<number> {
  const r = await prisma.$queryRaw<{ ano: number }[]>`
    SELECT e.ano FROM conta_grupo cg JOIN exercicio e ON e.id = cg.exercicio_id WHERE cg.id = ${grupoId}`
  return r[0].ano
}
async function anoDoItem(itemId: number): Promise<number> {
  const r = await prisma.$queryRaw<{ ano: number }[]>`
    SELECT e.ano FROM conta_item ci
      JOIN conta_grupo cg ON cg.id = ci.grupo_id
      JOIN exercicio e ON e.id = cg.exercicio_id WHERE ci.id = ${itemId}`
  return r[0].ano
}

interface ItemRow {
  id: bigint; grupo_id: bigint; grupo_codigo: string; nome: string
  periodicidade: string; classificacao: string | null; mes_inicio: number | null; mes_fim: number | null
  valor_orcado: unknown; valor_orcado_mensal: unknown; comentarios: string | null
}

export async function getOrcamento(ano: number): Promise<LinhaOrcamento[]> {
  const rows = await prisma.$queryRaw<ItemRow[]>`
    SELECT ci.id, ci.grupo_id, cg.codigo::text AS grupo_codigo,
           ci.nome, ci.periodicidade, ci.classificacao, ci.mes_inicio, ci.mes_fim,
           ci.valor_orcado, ci.valor_orcado_mensal, ci.comentarios
    FROM conta_item ci
    JOIN conta_grupo cg ON cg.id = ci.grupo_id
    JOIN exercicio e ON e.id = cg.exercicio_id
    WHERE e.ano = ${ano}
      AND ci.origem = 'orcamento'
    ORDER BY ci.id
  `
  return rows.map((r) => {
    const periodicidade = r.periodicidade === "A" ? "A" : "M"
    const valorOrcadoMensal = Number(r.valor_orcado_mensal)
    return {
      id: Number(r.id), grupoId: Number(r.grupo_id), grupoCodigo: r.grupo_codigo,
      nome: r.nome, periodicidade,
      classificacao: (r.classificacao as LinhaOrcamento["classificacao"]) ?? null,
      mesInicio: r.mes_inicio, mesFim: r.mes_fim,
      valorOrcado: Number(r.valor_orcado), valorOrcadoMensal,
      orcadoPorMes: distribuirPorMes({ periodicidade, valorOrcadoMensal, mesInicio: r.mes_inicio, mesFim: r.mes_fim }),
      comentarios: r.comentarios,
    }
  })
}

// `apenasOrcamento` filtra os grupos do plano congelado (origem='orcamento'), escondendo
// categorias criadas na Execução (origem='execucao') — a Orçamentação publicada não deve
// exibi-las. A Execução chama sem o flag (precisa de TODOS os grupos para a cascata de
// novo item poder pendurar itens sob categorias de meio de ano).
export async function getGrupos(ano: number, apenasOrcamento = false): Promise<GrupoOrcamento[]> {
  const rows = await prisma.$queryRaw<{ id: bigint; codigo: string; codigo_pai: string | null; tipo: string; nome: string }[]>`
    SELECT cg.id, cg.codigo::text AS codigo, pai.codigo::text AS codigo_pai, tc.sigla AS tipo, cg.nome
    FROM conta_grupo cg
    JOIN tipo_conta tc ON tc.id = cg.tipo_conta_id
    LEFT JOIN conta_grupo pai ON pai.id = cg.grupo_pai_id
    JOIN exercicio e ON e.id = cg.exercicio_id
    WHERE e.ano = ${ano}
      AND (${apenasOrcamento} = false OR cg.origem = 'orcamento')
    ORDER BY cg.codigo::numeric
  `
  return rows.map((r) => ({
    id: Number(r.id), codigo: r.codigo, codigoPai: r.codigo_pai,
    tipo: r.tipo as TipoConta, nome: r.nome,
  }))
}

type DbClient = typeof prisma | Prisma.TransactionClient

async function inserirItem(
  input: NovoItemInput,
  origem: "orcamento" | "execucao" = "orcamento",
  db: DbClient = prisma,
): Promise<number> {
  const { valorOrcado, valorOrcadoMensal } = normalizarOrcado(input.valor, input.periodicidade)
  const prox = await db.$queryRaw<{ codigo: number }[]>`
    SELECT COALESCE(MAX(codigo)::int, (SELECT codigo::int FROM conta_grupo WHERE id = ${input.grupoId})) + 1 AS codigo
    FROM conta_item WHERE grupo_id = ${input.grupoId}
  `
  const rows = await db.$queryRaw<{ id: bigint }[]>`
    INSERT INTO conta_item (grupo_id, codigo, nome, periodicidade, valor_orcado, valor_orcado_mensal,
                            classificacao, mes_inicio, mes_fim, comentarios, origem)
    VALUES (${input.grupoId}, ${prox[0].codigo}, ${input.nome}, ${input.periodicidade},
            ${valorOrcado}::numeric, ${valorOrcadoMensal}::numeric,
            ${input.classificacao ?? null}, ${input.mesInicio ?? null}, ${input.mesFim ?? null},
            ${input.comentarios ?? null}, ${origem})
    RETURNING id
  `
  return Number(rows[0].id)
}

// Materializa o orçado de UM item nos meses da vigência (insert-only).
// M → mes_inicio..mes_fim; A → 1..12. Fora da vigência não cria linha (a view mostra 0).
async function materializarOrcadoItem(db: DbClient, contaItemId: number): Promise<void> {
  await db.$executeRaw`
    INSERT INTO lancamento_realizado (conta_item_id, exercicio_id, competencia, valor_orcado)
    SELECT ci.id, cg.exercicio_id, make_date(ex.ano, g.mes, 1), ci.valor_orcado_mensal
    FROM conta_item ci
    JOIN conta_grupo cg ON cg.id = ci.grupo_id
    JOIN exercicio   ex ON ex.id = cg.exercicio_id
    CROSS JOIN generate_series(1, 12) AS g(mes)
    WHERE ci.id = ${contaItemId}
      AND ( ci.periodicidade = 'A'
            OR g.mes BETWEEN COALESCE(ci.mes_inicio, 1) AND COALESCE(ci.mes_fim, 12) )
    ON CONFLICT (conta_item_id, competencia) DO NOTHING`
}

export async function criarItem(input: NovoItemInput): Promise<number> {
  await exigirRascunhoPorAno(await anoDoGrupo(input.grupoId))
  return inserirItem(input)
}

// Ajuste de meio de ano: cria item mesmo com o orçamento publicado, nasce origem='execucao'
// (não entra no orçamento congelado). Vigência não pode invadir mês concluído (→ 409).
export async function criarItemExecucao(input: NovoItemInput): Promise<number> {
  const ano = await anoDoGrupo(input.grupoId)
  const statusPorMes = await getStatusTodos(ano)
  if (vigenciaInvalidaPorFechamento(input.periodicidade, input.mesInicio ?? null, input.mesFim ?? null, statusPorMes)) {
    throw new Error("VIGENCIA_MES_FECHADO")
  }
  // Retry no conflito de código automático (conta_item_codigo_uq) — corrida rara (admin único).
  for (let tentativa = 0; ; tentativa++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const id = await inserirItem(input, "execucao", tx)
        await materializarOrcadoItem(tx, id)
        return id
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (tentativa < 2 && msg.includes("conta_item_codigo_uq")) continue
      throw e
    }
  }
}

export async function atualizarItem(id: number, input: AtualizarItemInput): Promise<void> {
  await exigirRascunhoPorAno(await anoDoItem(id))
  const atual = (await prisma.$queryRaw<ItemRow[]>`
    SELECT ci.*, cg.codigo::text AS grupo_codigo FROM conta_item ci
    JOIN conta_grupo cg ON cg.id = ci.grupo_id WHERE ci.id = ${id}`)[0]
  const periodicidade = (input.periodicidade ?? (atual.periodicidade === "A" ? "A" : "M")) as "M" | "A"
  const valorBase = input.valor ?? (periodicidade === "A" ? Number(atual.valor_orcado) : Number(atual.valor_orcado_mensal))
  const { valorOrcado, valorOrcadoMensal } = normalizarOrcado(valorBase, periodicidade)
  await prisma.$executeRaw`
    UPDATE conta_item SET
      nome = ${input.nome ?? atual.nome},
      periodicidade = ${periodicidade},
      valor_orcado = ${valorOrcado}::numeric,
      valor_orcado_mensal = ${valorOrcadoMensal}::numeric,
      classificacao = ${input.classificacao ?? atual.classificacao},
      mes_inicio = ${periodicidade === "A" ? null : (input.mesInicio ?? atual.mes_inicio)},
      mes_fim = ${periodicidade === "A" ? null : (input.mesFim ?? atual.mes_fim)},
      comentarios = ${input.comentarios ?? atual.comentarios},
      updated_at = now()
    WHERE id = ${id}
  `
}

export async function criarGrupo(
  input: { ano: number; codigoPai: string | null; tipo: TipoConta; nome: string; codigo: number },
  origem: "orcamento" | "execucao" = "orcamento",
): Promise<number> {
  await exigirRascunhoPorAno(input.ano)
  const rows = await prisma.$queryRaw<{ id: bigint }[]>`
    INSERT INTO conta_grupo (exercicio_id, codigo, grupo_pai_id, tipo_conta_id, nome, origem)
    SELECT e.id, ${input.codigo},
      (SELECT id FROM conta_grupo WHERE codigo = ${input.codigoPai ?? null}::numeric AND exercicio_id = e.id),
      (SELECT id FROM tipo_conta WHERE sigla = ${input.tipo}), ${input.nome}, ${origem}
    FROM exercicio e WHERE e.ano = ${input.ano}
    RETURNING id
  `
  return Number(rows[0].id)
}

// Auto-código sob o pai: o namespace de código sob um pai é compartilhado entre subgrupos
// e itens (itens começam em pai.codigo+1), então o próximo código é GREATEST(max subgrupo,
// max item)+1; cai em pai.codigo+1 quando o pai não tem nem subgrupos nem itens. Tipo herdado.
async function criarGrupoFilho(
  grupoPaiId: number, nome: string, origem: "orcamento" | "execucao",
): Promise<number> {
  const rows = await prisma.$queryRaw<{ id: bigint }[]>`
    INSERT INTO conta_grupo (exercicio_id, codigo, grupo_pai_id, tipo_conta_id, nome, origem)
    SELECT pai.exercicio_id,
           COALESCE(GREATEST(
             (SELECT MAX(f.codigo)  FROM conta_grupo f WHERE f.grupo_pai_id = pai.id),
             (SELECT MAX(it.codigo) FROM conta_item  it WHERE it.grupo_id    = pai.id)
           ), pai.codigo) + 1,
           pai.id, pai.tipo_conta_id, ${nome}, ${origem}
    FROM conta_grupo pai WHERE pai.id = ${grupoPaiId}
    RETURNING id
  `
  return Number(rows[0].id)
}

// RF-10: cria subgrupo/categoria de meio de ano pela Execução. origem='execucao'.
export async function criarGrupoExecucao(input: { grupoPaiId: number; nome: string }): Promise<number> {
  return criarGrupoFilho(input.grupoPaiId, input.nome, "execucao")
}

// Cria categoria no plano (tela de Orçamento). Só em rascunho; origem='orcamento'.
export async function criarGrupoOrcamento(input: { grupoPaiId: number; nome: string }): Promise<number> {
  await exigirRascunhoPorAno(await anoDoGrupo(input.grupoPaiId))
  return criarGrupoFilho(input.grupoPaiId, input.nome, "orcamento")
}

export async function atualizarGrupo(id: number, nome: string): Promise<void> {
  await exigirRascunhoPorAno(await anoDoGrupo(id))
  await prisma.$executeRaw`UPDATE conta_grupo SET nome = ${nome}, updated_at = now() WHERE id = ${id}`
}

export async function excluirItem(id: number): Promise<void> {
  await exigirRascunhoPorAno(await anoDoItem(id))
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`DELETE FROM lancamento_realizado WHERE conta_item_id = ${id}`
    await tx.$executeRaw`DELETE FROM conta_item WHERE id = ${id}`
  })
}

export async function excluirGrupo(id: number): Promise<void> {
  await exigirRascunhoPorAno(await anoDoGrupo(id))
  const filhos = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT (SELECT count(*) FROM conta_grupo WHERE grupo_pai_id = ${id})
         + (SELECT count(*) FROM conta_item  WHERE grupo_id     = ${id}) AS n`
  if (Number(filhos[0].n) > 0) throw new Error("GRUPO_NAO_VAZIO")
  await prisma.$executeRaw`DELETE FROM conta_grupo WHERE id = ${id}`
}

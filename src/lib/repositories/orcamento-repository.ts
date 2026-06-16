import { prisma } from "@/lib/prisma"
import { normalizarOrcado, distribuirPorMes } from "@/lib/services/orcamento-service"
import type {
  LinhaOrcamento, GrupoOrcamento, NovoItemInput, AtualizarItemInput, TipoConta,
} from "@/lib/types"

interface ItemRow {
  id: bigint; grupo_id: bigint; grupo_codigo: string; codigo: string; nome: string
  periodicidade: string; classificacao: string | null; mes_inicio: number | null; mes_fim: number | null
  valor_orcado: unknown; valor_orcado_mensal: unknown; comentarios: string | null
}

export async function getOrcamento(ano: number): Promise<LinhaOrcamento[]> {
  const rows = await prisma.$queryRaw<ItemRow[]>`
    SELECT ci.id, ci.grupo_id, cg.codigo::text AS grupo_codigo, ci.codigo::text AS codigo,
           ci.nome, ci.periodicidade, ci.classificacao, ci.mes_inicio, ci.mes_fim,
           ci.valor_orcado, ci.valor_orcado_mensal, ci.comentarios
    FROM conta_item ci
    JOIN conta_grupo cg ON cg.id = ci.grupo_id
    JOIN exercicio e ON e.id = cg.exercicio_id
    WHERE e.ano = ${ano}
    ORDER BY ci.codigo::numeric
  `
  return rows.map((r) => {
    const periodicidade = r.periodicidade === "A" ? "A" : "M"
    const valorOrcadoMensal = Number(r.valor_orcado_mensal)
    return {
      id: Number(r.id), grupoId: Number(r.grupo_id), grupoCodigo: r.grupo_codigo,
      codigo: r.codigo, nome: r.nome, periodicidade,
      classificacao: (r.classificacao as LinhaOrcamento["classificacao"]) ?? null,
      mesInicio: r.mes_inicio, mesFim: r.mes_fim,
      valorOrcado: Number(r.valor_orcado), valorOrcadoMensal,
      orcadoPorMes: distribuirPorMes({ periodicidade, valorOrcadoMensal, mesInicio: r.mes_inicio, mesFim: r.mes_fim }),
      comentarios: r.comentarios,
    }
  })
}

export async function getGrupos(ano: number): Promise<GrupoOrcamento[]> {
  const rows = await prisma.$queryRaw<{ id: bigint; codigo: string; codigo_pai: string | null; tipo: string; nome: string }[]>`
    SELECT cg.id, cg.codigo::text AS codigo, pai.codigo::text AS codigo_pai, tc.sigla AS tipo, cg.nome
    FROM conta_grupo cg
    JOIN tipo_conta tc ON tc.id = cg.tipo_conta_id
    LEFT JOIN conta_grupo pai ON pai.id = cg.grupo_pai_id
    JOIN exercicio e ON e.id = cg.exercicio_id
    WHERE e.ano = ${ano}
    ORDER BY cg.codigo::numeric
  `
  return rows.map((r) => ({
    id: Number(r.id), codigo: r.codigo, codigoPai: r.codigo_pai,
    tipo: r.tipo as TipoConta, nome: r.nome,
  }))
}

export async function criarItem(input: NovoItemInput): Promise<number> {
  const { valorOrcado, valorOrcadoMensal } = normalizarOrcado(input.valor, input.periodicidade)
  const prox = await prisma.$queryRaw<{ codigo: number }[]>`
    SELECT COALESCE(MAX(codigo)::int, (SELECT codigo::int FROM conta_grupo WHERE id = ${input.grupoId})) + 1 AS codigo
    FROM conta_item WHERE grupo_id = ${input.grupoId}
  `
  const rows = await prisma.$queryRaw<{ id: bigint }[]>`
    INSERT INTO conta_item (grupo_id, codigo, nome, periodicidade, valor_orcado, valor_orcado_mensal,
                            classificacao, mes_inicio, mes_fim)
    VALUES (${input.grupoId}, ${prox[0].codigo}, ${input.nome}, ${input.periodicidade},
            ${valorOrcado}::numeric, ${valorOrcadoMensal}::numeric,
            ${input.classificacao ?? null}, ${input.mesInicio ?? null}, ${input.mesFim ?? null})
    RETURNING id
  `
  return Number(rows[0].id)
}

export async function atualizarItem(id: number, input: AtualizarItemInput): Promise<void> {
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
      updated_at = now()
    WHERE id = ${id}
  `
}

export async function criarGrupo(input: { ano: number; codigoPai: string | null; tipo: TipoConta; nome: string; codigo: number }): Promise<number> {
  const rows = await prisma.$queryRaw<{ id: bigint }[]>`
    INSERT INTO conta_grupo (exercicio_id, codigo, grupo_pai_id, tipo_conta_id, nome)
    SELECT e.id, ${input.codigo},
      (SELECT id FROM conta_grupo WHERE codigo = ${input.codigoPai ?? null}::numeric AND exercicio_id = e.id),
      (SELECT id FROM tipo_conta WHERE sigla = ${input.tipo}), ${input.nome}
    FROM exercicio e WHERE e.ano = ${input.ano}
    RETURNING id
  `
  return Number(rows[0].id)
}

export async function atualizarGrupo(id: number, nome: string): Promise<void> {
  await prisma.$executeRaw`UPDATE conta_grupo SET nome = ${nome}, updated_at = now() WHERE id = ${id}`
}

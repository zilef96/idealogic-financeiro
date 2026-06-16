import { prisma } from "@/lib/prisma"

function competencia(ano: number, mes: number) {
  return `${ano}-${String(mes).padStart(2, "0")}-01`
}

export type StatusFechamento = "aberto" | "concluido"

export async function getStatus(ano: number, mes: number): Promise<StatusFechamento> {
  const rows = await prisma.$queryRaw<{ status: string }[]>`
    SELECT fm.status FROM fechamento_mensal fm JOIN exercicio e ON e.id = fm.exercicio_id
    WHERE e.ano = ${ano} AND EXTRACT(MONTH FROM fm.competencia) = ${mes} LIMIT 1
  `
  return (rows[0]?.status as StatusFechamento) ?? "aberto"
}

export async function concluir(ano: number, mes: number, responsavel: string) {
  const comp = competencia(ano, mes)
  await prisma.$executeRaw`
    INSERT INTO fechamento_mensal (exercicio_id, competencia, status, concluido_por, concluido_em)
    SELECT e.id, ${comp}::date, 'concluido', ${responsavel}, now() FROM exercicio e WHERE e.ano = ${ano}
    ON CONFLICT (exercicio_id, competencia)
    DO UPDATE SET status='concluido', concluido_por=${responsavel}, concluido_em=now(), updated_at=now()
  `
}

export async function reabrir(ano: number, mes: number) {
  const comp = competencia(ano, mes)
  await prisma.$executeRaw`
    UPDATE fechamento_mensal SET status='aberto', updated_at=now()
    WHERE competencia=${comp}::date AND exercicio_id=(SELECT id FROM exercicio WHERE ano=${ano})
  `
}

export interface EventoTesouraria { id: number; mes: number; tipo: "aplicacao" | "resgate"; valor: number; descricao: string | null }

export async function listarTesouraria(ano: number): Promise<EventoTesouraria[]> {
  const rows = await prisma.$queryRaw<{ id: bigint; mes: number; tipo: string; valor: unknown; descricao: string | null }[]>`
    SELECT et.id, EXTRACT(MONTH FROM et.competencia)::int AS mes, et.tipo, et.valor, et.descricao
    FROM evento_tesouraria et JOIN exercicio e ON e.id = et.exercicio_id
    WHERE e.ano = ${ano} ORDER BY et.competencia
  `
  return rows.map((r) => ({ id: Number(r.id), mes: r.mes, tipo: r.tipo as "aplicacao" | "resgate", valor: Number(r.valor), descricao: r.descricao }))
}

export async function criarTesouraria(ano: number, mes: number, tipo: "aplicacao" | "resgate", valor: number, descricao: string | null) {
  const comp = competencia(ano, mes)
  await prisma.$executeRaw`
    INSERT INTO evento_tesouraria (exercicio_id, competencia, tipo, valor, descricao)
    SELECT e.id, ${comp}::date, ${tipo}, ${valor}::numeric, ${descricao} FROM exercicio e WHERE e.ano = ${ano}
  `
}

export async function removerTesouraria(id: number) {
  await prisma.$executeRaw`DELETE FROM evento_tesouraria WHERE id = ${id}`
}

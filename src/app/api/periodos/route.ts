import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseBody, handleApiError, anoSchema } from "@/lib/api-helpers"
import { listarAnos, criarPeriodo } from "@/lib/repositories/periodo-repository"

export async function GET() {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  try { return NextResponse.json({ anos: await listarAnos() }) }
  catch (e) { return handleApiError(e, "Erro ao listar períodos.") }
}

const novoPeriodo = z.object({ ano: anoSchema, copiarDe: anoSchema.nullable().default(null) })

export async function POST(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = await parseBody(req, novoPeriodo); if (!parsed.ok) return parsed.response
  try {
    const periodo = await criarPeriodo(parsed.data.ano, parsed.data.copiarDe)
    return NextResponse.json(periodo, { status: 201 })
  } catch (e) { return handleApiError(e, "Falha ao criar período.") }
}

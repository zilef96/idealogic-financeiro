import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePerfil } from "@/lib/route-auth"
import { parseQuery, handleApiError, anoSchema } from "@/lib/api-helpers"
import { getExecucao } from "@/lib/repositories/execucao-repository"
import { getSeriesParametros } from "@/lib/repositories/parametro-repository"
import { listarTesouraria } from "@/lib/repositories/fechamento-repository"
import { getReceitaPorCliente } from "@/lib/repositories/dashboard-repository"
import { montarDashboard, valorVigente, type LinhaDash } from "@/lib/services/dashboard-service"

export async function GET(req: Request) {
  const auth = await requirePerfil(["admin"]); if (!auth.ok) return auth.response
  const parsed = parseQuery(new URL(req.url).searchParams, z.object({ ano: anoSchema }))
  if (!parsed.ok) return parsed.response
  const ano = parsed.data.ano
  try {
    const [linhasExec, series, tesouraria, receitaClientes] = await Promise.all([
      getExecucao(ano), getSeriesParametros(ano), listarTesouraria(ano), getReceitaPorCliente(ano),
    ])
    const linhas: LinhaDash[] = linhasExec.map((l) => ({
      codigo: l.codigo, codigoPai: l.codigoPai, nome: l.nome, isGrupo: l.isGrupo,
      mes: l.mes, orcado: l.orcado, realizado: l.realizado,
    }))
    const payload = montarDashboard({
      ano, linhas, series,
      tesouraria: tesouraria.map((e) => ({ mes: e.mes, tipo: e.tipo, valor: e.valor })),
      receitaClientes,
      saldoInicial: valorVigente(series["saldo_inicial_caixa"] ?? [], 12, 126697.96),
      caixaMinimo: valorVigente(series["caixa_minimo"] ?? [], 12, 50000),
      horasPadrao: 3200,
    })
    return NextResponse.json(payload)
  } catch (e) { return handleApiError(e, "Erro ao carregar dashboard.") }
}

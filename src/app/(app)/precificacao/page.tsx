import { exigirPerfilPagina } from "@/lib/auth-server"
import { getAnosProgressao, getProgressao } from "@/lib/repositories/progressao-repository"
import { getDespesasRealizadasPorMes } from "@/lib/repositories/precificacao-repository"
import { getSeriesParametros } from "@/lib/repositories/parametro-repository"
import { opexMedio } from "@/lib/services/precificacao-service"
import { PrecificacaoView } from "@/components/precificacao/precificacao-view"

const MESES_OPEX = 3

export default async function PrecificacaoPage() {
  await exigirPerfilPagina(["admin", "socio"])
  const ano = new Date().getFullYear()
  const [anosProgressao, despesas, series] = await Promise.all([
    getAnosProgressao(),
    getDespesasRealizadasPorMes(ano),
    getSeriesParametros(ano),
  ])
  const anoTabela = anosProgressao[0] ?? ano
  // Custo da pessoa parte do valor bruto PJ da tabela (decisão do financeiro).
  const perfis = (await getProgressao(anoTabela)).filter((l) => l.regime === "PJ")

  // Horas faturáveis: último valor > 0 informado nos parâmetros do ano.
  const horasInformadas = (series["horas_faturaveis"] ?? []).filter((s) => s.valor > 0).at(-1)?.valor ?? null

  return (
    <PrecificacaoView
      anoTabela={anoTabela}
      perfis={perfis}
      opex={opexMedio(despesas, MESES_OPEX)}
      horasFaturaveis={horasInformadas}
    />
  )
}

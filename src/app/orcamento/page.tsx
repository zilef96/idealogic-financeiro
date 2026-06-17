import { exigirPerfilPagina } from "@/lib/auth-server"
import { getOrcamento, getGrupos } from "@/lib/repositories/orcamento-repository"
import { listarAnos, getStatusExercicio } from "@/lib/repositories/periodo-repository"
import { TabelaOrcamento } from "@/components/orcamento/tabela-orcamento"
import { SeletorPeriodo } from "@/components/periodo/seletor-periodo"
import { BadgeStatus } from "@/components/periodo/badge-status"

export default async function OrcamentoPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await exigirPerfilPagina(["admin"])
  const { ano } = await searchParams
  const anoNum = Number(ano) || new Date().getFullYear()
  const [linhas, grupos, anos, status] = await Promise.all([
    getOrcamento(anoNum), getGrupos(anoNum), listarAnos(), getStatusExercicio(anoNum),
  ])
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold">Orçamentação {anoNum}</h1>
        <div className="flex items-center gap-3">
          <BadgeStatus ano={anoNum} status={status} />
          <SeletorPeriodo ano={anoNum} anos={anos} />
        </div>
      </div>
      <TabelaOrcamento linhas={linhas} grupos={grupos} editavel={status !== "publicado"} />
    </div>
  )
}

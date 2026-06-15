import { exigirPerfilPagina } from "@/lib/auth-server"
import { getOrcamento, getGrupos } from "@/lib/repositories/orcamento-repository"
import { listarAnos } from "@/lib/repositories/periodo-repository"
import { TabelaOrcamento } from "@/components/orcamento/tabela-orcamento"
import { SeletorPeriodo } from "@/components/periodo/seletor-periodo"
import { NovoItem } from "@/components/orcamento/novo-item"

export default async function OrcamentoPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await exigirPerfilPagina(["admin"])
  const { ano } = await searchParams
  const anoNum = Number(ano) || new Date().getFullYear()
  const [linhas, grupos, anos] = await Promise.all([getOrcamento(anoNum), getGrupos(anoNum), listarAnos()])
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold">Orçamentação {anoNum}</h1>
        <div className="flex items-center gap-2">
          <NovoItem grupos={grupos} />
          <SeletorPeriodo ano={anoNum} anos={anos} />
        </div>
      </div>
      <TabelaOrcamento linhas={linhas} grupos={grupos} />
    </div>
  )
}

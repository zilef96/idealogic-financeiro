import { exigirPerfilPagina } from "@/lib/auth-server"
import { getExecucao } from "@/lib/repositories/execucao-repository"
import { AbasExecucao } from "@/components/execucao/abas-execucao"

export default async function ExecucaoPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await exigirPerfilPagina(["admin"])
  const { ano } = await searchParams
  const anoNum = Number(ano) || new Date().getFullYear()
  const linhas = await getExecucao(anoNum)
  const mesAtual = new Date().getMonth() + 1
  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Execução Orçamentária {anoNum}</h1>
      <AbasExecucao ano={anoNum} mesAtual={mesAtual} linhas={linhas} />
    </div>
  )
}

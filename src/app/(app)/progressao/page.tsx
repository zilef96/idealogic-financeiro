import { exigirPerfilPagina } from "@/lib/auth-server"
import { getAnosProgressao, getProgressao } from "@/lib/repositories/progressao-repository"
import { montarGrades } from "@/lib/services/progressao-service"
import { ProgressaoView } from "@/components/progressao/progressao-view"

export default async function ProgressaoPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await exigirPerfilPagina(["admin", "socio"])
  const { ano } = await searchParams
  const anos = await getAnosProgressao()
  const anoNum = anos.includes(Number(ano)) ? Number(ano) : (anos[0] ?? new Date().getFullYear())
  const grades = montarGrades(await getProgressao(anoNum))
  return <ProgressaoView ano={anoNum} anos={anos} grades={grades} />
}

import { exigirPerfilPagina } from "@/lib/auth-server"
import { getParametrosExercicio } from "@/lib/repositories/parametro-repository"
import { FormParametros } from "@/components/parametros/form-parametros"

export default async function ParametrosPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await exigirPerfilPagina(["admin"])
  const { ano } = await searchParams
  const anoNum = Number(ano) || new Date().getFullYear()
  const valores = await getParametrosExercicio(anoNum)
  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Parâmetros do exercício {anoNum}</h1>
      <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
        Variáveis válidas para o ano todo. Alimentam caixa, tributos e custo-hora.
      </p>
      <FormParametros ano={anoNum} valores={valores} />
    </div>
  )
}

import { exigirPerfilPagina } from "@/lib/auth-server"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await exigirPerfilPagina(["admin"])
  const { ano } = await searchParams
  const anoNum = Number(ano) || new Date().getFullYear()
  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Dashboard Financeiro {anoNum}</h1>
      <p style={{ color: "rgb(var(--muted))" }}>Em construção.</p>
    </div>
  )
}

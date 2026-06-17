import type { Alerta } from "@/lib/services/dashboard-service"

export function AlertBar({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {alertas.map((a, i) => {
        const critico = a.nivel === "critico"
        const cor = critico ? "rgb(var(--danger))" : "rgb(var(--amber))"
        return (
          <span key={i} className="rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: cor, color: cor }}>
            {critico ? "⛔" : "⚠"} {a.mensagem}
          </span>
        )
      })}
    </div>
  )
}

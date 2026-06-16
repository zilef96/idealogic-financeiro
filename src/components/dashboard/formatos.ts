import type { FormatoIndicador } from "@/lib/services/dashboard-service"

export const NOMES_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function fmtValor(valor: number | null, formato: FormatoIndicador): string {
  if (valor == null) return "—"
  switch (formato) {
    case "percent": return `${valor.toFixed(1)}%`
    case "numero": return valor.toLocaleString("pt-BR")
    case "fator": return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    default: return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
  }
}

export function fmtDelta(valor: number | null, formato: "percent" | "pontos" | "moeda" | "numero"): string {
  if (valor == null) return "—"
  const sinal = valor > 0 ? "▲ " : valor < 0 ? "▼ " : ""
  const abs = Math.abs(valor)
  if (formato === "moeda") return sinal + abs.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
  if (formato === "numero") return sinal + abs.toLocaleString("pt-BR")
  if (formato === "pontos") return `${sinal}${abs.toFixed(1)} p.p.`
  return `${sinal}${abs.toFixed(1)}%`
}

// Formatadores para tooltips do Recharts (o valor chega como ValueType | undefined).
export function fmtMoedaTip(v: unknown): string {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}
export function fmtPctTip(v: unknown): string {
  const n = Number(v)
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : "—"
}

// Verde = melhora; vermelho = piora. inverted troca o sentido (despesa/tributo: subir é ruim).
export function corDelta(valor: number | null, inverted: boolean): string {
  if (valor == null || valor === 0) return "rgb(var(--muted))"
  const bom = inverted ? valor < 0 : valor > 0
  return bom ? "#16a34a" : "#dc2626"
}

"use client"
import { useTheme } from "next-themes"

// Cores estruturais dos gráficos resolvidas por tema. Recharts aplica cor em
// atributos SVG, onde var(--token) do CSS não resolve de forma confiável — por
// isso usamos valores concretos, alinhados aos tokens de globals.css, com
// contraste AA (texto ≥ 4.5:1) em ambos os temas.
export interface ChartTheme {
  grid: string
  axis: string        // texto dos eixos
  label: string       // rótulos sobre barras
  refLine: string     // linhas de referência neutras (ex.: zero)
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
  tributos: [string, string, string]
}

const DARK: ChartTheme = {
  grid: "#2a2d34",
  axis: "#a7a59f",
  label: "#d2d0cb",
  refLine: "#96948e",
  tooltipBg: "#191b1f",
  tooltipBorder: "#2a2d34",
  tooltipText: "#e8e6e2",
  tributos: ["#cbd5e1", "#94a3b8", "#64748b"],
}

const LIGHT: ChartTheme = {
  grid: "#e6e3db",
  axis: "#6b6961",
  label: "#44403c",
  refLine: "#76746e",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e6e3db",
  tooltipText: "#1a1a1c",
  tributos: ["#94a3b8", "#64748b", "#475569"],
}

export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme()
  return resolvedTheme === "dark" ? DARK : LIGHT
}

// Estilo de tooltip coerente com o tema (fundo, borda e texto legíveis).
export function tooltipEstilo(ct: ChartTheme) {
  return {
    contentStyle: { backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: ct.tooltipText },
    labelStyle: { color: ct.tooltipText },
    // Sem itemStyle o Recharts pinta cada linha de item em preto (invisível no tema escuro).
    itemStyle: { color: ct.tooltipText },
  }
}

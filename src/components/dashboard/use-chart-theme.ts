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
  grid: "#1c262a",
  axis: "#7c8b8a",
  label: "#c7d0cf",
  refLine: "#5a6b6a",
  tooltipBg: "#0d1417",
  tooltipBorder: "#1c262a",
  tooltipText: "#f3f6f5",
  tributos: ["#b9c4c3", "#8b9998", "#5c6b6a"],
}

const LIGHT: ChartTheme = {
  grid: "#e4e2da",
  axis: "#6e6e7a",
  label: "#2b2b3d",
  refLine: "#8a8a94",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e4e2da",
  tooltipText: "#14142b",
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

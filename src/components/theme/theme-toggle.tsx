"use client"
import { useTheme } from "next-themes"

// O ícone visível é escolhido pelo CSS a partir da classe `.dark` que o
// next-themes aplica no <html>. Assim o markup do servidor e o do cliente são
// idênticos — sem estado de montagem e sem descompasso de hidratação.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Alternar entre tema claro e escuro"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border"
    >
      <span aria-hidden className="dark:hidden">☾</span>
      <span aria-hidden className="hidden dark:inline">☀</span>
    </button>
  )
}

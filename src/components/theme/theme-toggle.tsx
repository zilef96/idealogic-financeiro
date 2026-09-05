"use client"
import { Sun, Moon } from "lucide-react"
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-border text-muted"
    >
      <Sun size={15} strokeWidth={1.9} aria-hidden className="hidden dark:block" />
      <Moon size={15} strokeWidth={1.9} aria-hidden className="dark:hidden" />
    </button>
  )
}

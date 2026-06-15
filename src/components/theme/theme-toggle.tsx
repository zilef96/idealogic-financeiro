"use client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  if (!montado) return <div className="h-9 w-9" aria-hidden />
  const escuro = resolvedTheme === "dark"
  return (
    <button
      type="button"
      onClick={() => setTheme(escuro ? "light" : "dark")}
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border"
    >
      {escuro ? "☀" : "☾"}
    </button>
  )
}

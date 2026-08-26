"use client"
import { useEffect } from "react"
import { ThemeProvider as NextThemes } from "next-themes"

// next-themes injeta um <script> pra aplicar o tema antes do hydration (evita
// flash de tema errado) — funciona certo no SSR, mas o React 19 avisa sobre
// qualquer <script> renderizado por componente, gerando um falso positivo só
// em dev (https://github.com/pacocoursey/next-themes/issues/387). Filtra só
// essa mensagem específica, sem mexer no resto do console.error.
function useSuppressScriptTagWarning() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    const original = console.error
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("Encountered a script tag while rendering")) {
        return
      }
      original(...args)
    }
    return () => {
      console.error = original
    }
  }, [])
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useSuppressScriptTagWarning()
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemes>
  )
}

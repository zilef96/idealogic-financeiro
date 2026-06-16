import "./globals.css"
import type { Metadata } from "next"
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { AppShell } from "@/components/shell/app-shell"
import { ToastProvider } from "@/components/ui/toast"
import { getUsuario } from "@/lib/auth-server"

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] })
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"] })
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] })

export const metadata: Metadata = { title: "Dashboard Financeiro Idealogic" }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sessao = await getUsuario()
  const usuario = sessao
    ? { nome: sessao.nome, email: sessao.email, perfil: sessao.perfil }
    : null
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${bricolage.variable} ${hanken.variable} ${jetbrains.variable} antialiased`}
    >
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AppShell usuario={usuario}>{children}</AppShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

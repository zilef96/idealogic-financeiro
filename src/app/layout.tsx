import "./globals.css"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { AppShell } from "@/components/shell/app-shell"
import { getUsuario } from "@/lib/auth-server"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

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
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <ThemeProvider>
          <AppShell usuario={usuario}>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}

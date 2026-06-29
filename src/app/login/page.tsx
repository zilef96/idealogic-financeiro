"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/brand/logo"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")

  async function entrar(e: React.FormEvent) {
    e.preventDefault(); setErro("")
    const r = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    })
    if (r.ok) {
      const { perfil } = await r.json()
      router.replace(perfil === "admin" ? "/orcamento" : "/dashboard")
      router.refresh()
    } else {
      setErro("Credenciais inválidas.")
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-3 text-center">
          {/* Espaço reservado para o logo oficial */}
          <Logo size={56} />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Gestão Financeira</h1>
            <p className="text-sm text-muted">Idealogic — Orçamento 2026</p>
          </div>
        </div>
        <form onSubmit={entrar} className="space-y-3 rounded-lg border border-border p-6">
          <input className="w-full rounded border border-border bg-background p-2" type="email"
            placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="w-full rounded border border-border bg-background p-2" type="password"
            placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <button className="w-full rounded bg-foreground p-2 text-background" type="submit">Entrar</button>
        </form>
      </div>
    </main>
  )
}

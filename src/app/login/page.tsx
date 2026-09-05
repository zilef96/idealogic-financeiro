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
      router.replace("/")
      router.refresh()
    } else {
      setErro("Credenciais inválidas.")
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex items-center gap-2.5">
          <Logo size={38} />
          <div>
            <p className="font-display text-lg font-bold leading-tight text-ink">Idealogic</p>
            <p className="text-sm text-muted">Gestão Financeira</p>
          </div>
        </div>

        <form onSubmit={entrar} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink">E-mail</label>
            <input
              id="email" type="email" required
              className="rounded-[10px] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-teal"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="text-sm font-medium text-ink">Senha</label>
            <input
              id="senha" type="password" required
              className="rounded-[10px] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-teal"
              value={senha} onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          {erro && <p className="text-sm text-danger" role="alert">{erro}</p>}
          <button
            type="submit"
            className="mt-2 rounded-[10px] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, rgb(var(--teal)), rgb(var(--blue)))" }}
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  )
}

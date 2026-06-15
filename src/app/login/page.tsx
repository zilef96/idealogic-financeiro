"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

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
    if (r.ok) router.push("/orcamento")
    else setErro("Credenciais inválidas.")
  }

  return (
    <div className="mx-auto mt-16 max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Entrar</h1>
      <form onSubmit={entrar} className="space-y-3">
        <input className="w-full rounded border border-border bg-background p-2" type="email"
          placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded border border-border bg-background p-2" type="password"
          placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        {erro && <p className="text-sm text-danger">{erro}</p>}
        <button className="w-full rounded bg-foreground p-2 text-background" type="submit">Entrar</button>
      </form>
    </div>
  )
}

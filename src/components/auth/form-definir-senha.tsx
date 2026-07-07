"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function FormDefinirSenha() {
  const [senha, setSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [msg, setMsg] = useState("")
  const router = useRouter()

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setMsg("")
    if (senha.length < 8) { setMsg("A senha precisa ter ao menos 8 caracteres."); return }
    if (senha !== confirmacao) { setMsg("As senhas não conferem."); return }
    const r = await fetch("/api/auth/senha", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    })
    if (r.ok) { router.push("/"); router.refresh() } else { setMsg("Falha ao definir a senha.") }
  }

  return (
    <form onSubmit={enviar} className="max-w-sm space-y-3 rounded-lg border border-border p-6">
      <input className="w-full rounded border border-border bg-background p-2" type="password"
        placeholder="Nova senha (mín. 8 caracteres)" value={senha}
        onChange={(e) => setSenha(e.target.value)} required />
      <input className="w-full rounded border border-border bg-background p-2" type="password"
        placeholder="Confirmar a senha" value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)} required />
      {msg && <p className="text-sm text-muted">{msg}</p>}
      <button className="w-full rounded bg-foreground p-2 text-background" type="submit">Salvar senha</button>
    </form>
  )
}

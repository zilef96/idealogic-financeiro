"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { API_BASE } from "@/lib/api-base"

export function FormDefinirSenha() {
  const [senha, setSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [msg, setMsg] = useState("")
  const router = useRouter()

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setMsg("")
    if (senha.length < 8) { setMsg("A senha precisa ter ao menos 8 caracteres."); return }
    if (senha !== confirmacao) { setMsg("As senhas não conferem."); return }
    const r = await fetch(`${API_BASE}/auth/senha`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    })
    if (r.ok) { router.push("/"); router.refresh() } else { setMsg("Falha ao definir a senha.") }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nova-senha" className="text-sm font-medium text-ink">Nova senha</label>
        <input
          id="nova-senha" type="password" required minLength={8}
          placeholder="Mín. 8 caracteres"
          className="rounded-[10px] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-teal"
          value={senha} onChange={(e) => setSenha(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmar-senha" className="text-sm font-medium text-ink">Confirmar a senha</label>
        <input
          id="confirmar-senha" type="password" required
          className="rounded-[10px] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-teal"
          value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)}
        />
      </div>
      {msg && <p className="text-sm text-muted">{msg}</p>}
      <button
        type="submit"
        className="mt-2 rounded-[10px] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, rgb(var(--teal)), rgb(var(--blue)))" }}
      >
        Salvar senha
      </button>
    </form>
  )
}

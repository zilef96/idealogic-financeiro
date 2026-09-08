"use client"
import { useState } from "react"
import type { UsuarioComStatus } from "@/lib/services/usuario-service"
import { btn, btnPrimary } from "@/components/ui/botao"
import { useToast } from "@/components/ui/toast"
import { ModalAdicionarUsuario } from "@/components/admin/modal-adicionar-usuario"
import { ModalLink } from "@/components/admin/modal-link"
import { API_BASE } from "@/lib/api-base"

const ROTULO_PERFIL: Record<string, string> = { admin: "Admin", socio: "Sócio" }

// Cor semântica do status (mesmos tokens dos toasts/indicadores).
const CORES_STATUS: Record<string, { texto: string; fundo: string }> = {
  ativo: { texto: "--pos", fundo: "--pos-soft" },
  pendente: { texto: "--amber", fundo: "--amber-soft" },
}

function BadgeStatus({ status }: { status: string }) {
  const c = CORES_STATUS[status] ?? CORES_STATUS.pendente
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium"
      style={{ background: `rgb(var(${c.fundo}))`, color: `rgb(var(${c.texto}))` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: `rgb(var(${c.texto}))` }} />
      {status === "ativo" ? "Ativo" : "Pendente"}
    </span>
  )
}

export function ListaUsuarios({ usuarios }: { usuarios: UsuarioComStatus[] }) {
  const { toast } = useToast()
  const [abrirAdd, setAbrirAdd] = useState(false)
  const [modalLink, setModalLink] = useState<{ id: string; link: string } | null>(null)
  const [gerandoId, setGerandoId] = useState<string | null>(null)

  async function gerarLink(id: string) {
    setGerandoId(id)
    const r = await fetch(`${API_BASE}/admin/usuarios/${id}/link`, { method: "POST" })
    setGerandoId(null)
    if (!r.ok) { toast({ tipo: "erro", texto: "Falha ao gerar o link." }); return }
    const body = await r.json()
    setModalLink({ id, link: body.link })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => setAbrirAdd(true)} className={btnPrimary}>
          + Adicionar usuário
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[12px]" style={{ color: "rgb(var(--muted))" }}>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[13px]" style={{ color: "rgb(var(--muted))" }}>
                  Nenhum usuário ainda. Adicione o primeiro.
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{u.nome}</td>
                <td className="px-4 py-3" style={{ color: "rgb(var(--muted))" }}>{u.email}</td>
                <td className="px-4 py-3">{ROTULO_PERFIL[u.perfil] ?? u.perfil}</td>
                <td className="px-4 py-3"><BadgeStatus status={u.status} /></td>
                <td className="px-4 py-3 text-right">
                  {u.status === "pendente" && (
                    <button type="button" onClick={() => gerarLink(u.id)} disabled={gerandoId === u.id} className={btn}>
                      {gerandoId === u.id ? "Gerando…" : "Gerar link"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {abrirAdd && (
        <ModalAdicionarUsuario
          onFechar={() => setAbrirAdd(false)}
          onCriado={(r) => { setAbrirAdd(false); setModalLink(r) }}
        />
      )}
      {modalLink && (
        <ModalLink id={modalLink.id} linkInicial={modalLink.link} onFechar={() => setModalLink(null)} />
      )}
    </div>
  )
}

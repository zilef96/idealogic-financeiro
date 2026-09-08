"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"
import type { SeriesParametros } from "@/lib/repositories/parametro-repository"
import { valorVigente } from "@/lib/services/execucao-service"
import { saldosBancarios } from "@/lib/services/relatorio-service"
import { btn, btnPrimary } from "@/components/ui/botao"
import { useToast } from "@/components/ui/toast"
import { API_BASE } from "@/lib/api-base"

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const inputCls = "num w-40 rounded border border-border bg-background px-2 py-1 text-right text-sm"

// Campos "por vigência" (fora saldos): rótulo + chave + padrão + passo do input.
const CAMPOS = [
  { chave: "horas_faturaveis", rotulo: "Horas faturáveis", padrao: 3200, step: "1" },
  { chave: "fator_reajuste", rotulo: "Fator de reajuste salarial", padrao: 1, step: "0.01" },
] as const

type Form = {
  saldo_sicredi_cc: number
  saldo_sicredi_aplicacao: number
  saldo_banrisul_cc: number
  horas_faturaveis: number
  fator_reajuste: number
  saldo_inicial_caixa: number
}

const SALDO_KEYS = ["saldo_sicredi_cc", "saldo_sicredi_aplicacao", "saldo_banrisul_cc"] as const
const TODAS_KEYS: (keyof Form)[] = [...SALDO_KEYS, "horas_faturaveis", "fator_reajuste", "saldo_inicial_caixa"]

export function ModalParametros({ ano, mesInicial, series }: {
  ano: number; mesInicial: number; series: SeriesParametros
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [aberto, setAberto] = useState(false)
  const [mesSel, setMesSel] = useState(mesInicial)
  const [salvando, setSalvando] = useState(false)

  // Valores vigentes de um mês a partir das séries recebidas do servidor.
  const vigentes = (mes: number): Form => {
    const s = saldosBancarios(series, mes)
    return {
      saldo_sicredi_cc: s.sicrediCc,
      saldo_sicredi_aplicacao: s.sicrediAplicacao,
      saldo_banrisul_cc: s.banrisulCc,
      horas_faturaveis: valorVigente(series["horas_faturaveis"] ?? [], mes, 3200),
      fator_reajuste: valorVigente(series["fator_reajuste"] ?? [], mes, 1),
      saldo_inicial_caixa: valorVigente(series["saldo_inicial_caixa"] ?? [], 1, 126697.96),
    }
  }

  const [form, setForm] = useState<Form>(() => vigentes(mesInicial))
  // Referência do último estado salvo/carregado — base do "sujo" (dirty).
  const [base, setBase] = useState<Form>(form)

  // Ao trocar de mês, ou após o refresh trazer novas séries do servidor, recarrega
  // os vigentes e zera o "sujo" — padrão de ajuste de estado durante o render.
  const [sync, setSync] = useState({ mes: mesInicial, series })
  if (sync.mes !== mesSel || sync.series !== series) {
    const v = vigentes(mesSel)
    setSync({ mes: mesSel, series })
    setForm(v)
    setBase(v)
  }

  const sujo = useMemo(() => TODAS_KEYS.some((k) => form[k] !== base[k]), [form, base])
  const saldosMudaram = useMemo(() => SALDO_KEYS.some((k) => form[k] !== base[k]), [form, base])

  function fechar() {
    if (sujo && !window.confirm("Há alterações não salvas. Descartar a edição?")) return
    setAberto(false)
  }

  // Fechar com Esc (respeita a confirmação de alterações não salvas).
  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") fechar() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [aberto, sujo]) // eslint-disable-line react-hooks/exhaustive-deps

  const geral = form.saldo_sicredi_cc + form.saldo_sicredi_aplicacao + form.saldo_banrisul_cc

  // Salva tudo de uma vez: só dispara as chamadas dos grupos que realmente mudaram.
  async function salvarTudo() {
    setSalvando(true)
    const tarefas: Promise<Response>[] = []

    if (saldosMudaram) {
      tarefas.push(fetch(`${API_BASE}/relatorio/saldos`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano, mes: mesSel,
          saldoSicrediCc: form.saldo_sicredi_cc,
          saldoSicrediAplicacao: form.saldo_sicredi_aplicacao,
          saldoBanrisulCc: form.saldo_banrisul_cc,
        }),
      }))
    }

    const putParametro = (chave: string, valor: number, mes: number) =>
      fetch(`${API_BASE}/parametros`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano, mes, chave, valor }),
      })

    for (const campo of CAMPOS) {
      if (form[campo.chave] !== base[campo.chave]) tarefas.push(putParametro(campo.chave, form[campo.chave], mesSel))
    }
    if (mesSel === 1 && form.saldo_inicial_caixa !== base.saldo_inicial_caixa) {
      tarefas.push(putParametro("saldo_inicial_caixa", form.saldo_inicial_caixa, 1))
    }

    try {
      const respostas = await Promise.all(tarefas)
      setSalvando(false)
      if (respostas.every((r) => r.ok)) {
        setBase(form) // limpa o "sujo" já; o refresh reconfirma pelos vigentes.
        toast({ tipo: "sucesso", texto: "Parâmetros salvos." })
        router.refresh()
      } else {
        toast({ tipo: "erro", texto: "Falha ao salvar alguns parâmetros." })
      }
    } catch {
      setSalvando(false)
      toast({ tipo: "erro", texto: "Sem conexão ao salvar." })
    }
  }

  const set = <K extends keyof Form>(chave: K) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [chave]: Number(e.target.value) || 0 }))

  const contas = [
    { chave: "saldo_sicredi_cc" as const, rotulo: "Sicredi — Conta corrente" },
    { chave: "saldo_sicredi_aplicacao" as const, rotulo: "Sicredi — Aplicação" },
    { chave: "saldo_banrisul_cc" as const, rotulo: "Banrisul — Conta corrente" },
  ]

  return (
    <>
      <button type="button" className={btn}
        onClick={() => {
          // Abre sempre com os vigentes do mês atual (descarta edições de uma sessão anterior).
          const v = vigentes(mesInicial)
          setMesSel(mesInicial); setForm(v); setBase(v); setSync({ mes: mesInicial, series }); setAberto(true)
        }}>
        <SlidersHorizontal size={16} strokeWidth={2} aria-hidden /> Parâmetros
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={fechar}>
          <div onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between gap-3 p-5 pb-3">
              <h2 className="font-display text-base font-semibold">Parâmetros mensais · {ano}</h2>
              <select value={mesSel} onChange={(e) => setMesSel(Number(e.target.value))}
                className="h-8 rounded-[10px] border border-border bg-card px-3 text-[13px] font-medium">
                {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>

            {/* Corpo rolável */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
              {/* Saldos bancários (por mês) */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--muted))" }}>Contas da Idealogic</p>
                {contas.map((c) => (
                  <label key={c.chave} className="flex items-center justify-between gap-2 text-sm">
                    <span>{c.rotulo}</span>
                    <input type="number" min={0} step="0.01" className={inputCls}
                      value={form[c.chave]} onChange={set(c.chave)} />
                  </label>
                ))}
                <div className="flex items-center justify-between gap-2 text-sm font-medium">
                  <span>Saldo geral</span>
                  <span className="num">{geral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
              </div>

              {/* Parâmetros por vigência */}
              <div className="space-y-2 border-t border-border pt-3">
                {CAMPOS.map((campo) => (
                  <label key={campo.chave} className="flex items-center justify-between gap-2 text-sm">
                    <span>{campo.rotulo}</span>
                    <input type="number" min={0} step={campo.step} className={inputCls}
                      value={form[campo.chave]} onChange={set(campo.chave)} />
                  </label>
                ))}

                {/* Saldo inicial de caixa: só aparece em Janeiro (lançamento de abertura). */}
                {mesSel === 1 && (
                  <label className="flex items-center justify-between gap-2 text-sm">
                    <span>Saldo inicial de caixa (31/12 anterior)</span>
                    <input type="number" min={0} step="0.01" className={inputCls}
                      value={form.saldo_inicial_caixa} onChange={set("saldo_inicial_caixa")} />
                  </label>
                )}
              </div>
            </div>

            {/* Rodapé fixo */}
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
              <button type="button" onClick={fechar} className={btn}>Fechar</button>
              <button type="button" onClick={salvarTudo} disabled={!sujo || salvando} className={btnPrimary}>
                {salvando ? "Salvando…" : "Salvar tudo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

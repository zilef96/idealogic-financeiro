import type { ReactNode } from "react"
import type { ChartTheme } from "./use-chart-theme"

// Componentes de moldura dos gráficos: título com tooltip de informação (ⓘ).
// Sem hooks → pode ser usado tanto em server quanto em client components.

// Conteúdo de tooltip do Recharts com cor por série preservada — mas no marcador
// (quadradinho), não no texto. Assim cada linha continua identificável pela cor da
// série e o texto fica sempre legível (o padrão de pintar o texto na cor da série
// deixava itens ilegíveis no tema escuro). Recharts injeta active/payload/label.
interface ItemTooltip { name?: string; value?: ReactNode; color?: string }
type FmtTooltip = (value: unknown, name: unknown) => ReactNode
// Resolve a cor do marcador por item. Útil quando a série muda de cor por valor
// (ex.: barra verde/vermelha via <Cell>), caso em que e.color traz só a cor base.
type CorTooltip = (item: ItemTooltip) => string | undefined
interface TooltipConteudoProps {
  ct: ChartTheme
  formatter?: FmtTooltip
  corItem?: CorTooltip
  active?: boolean
  payload?: ItemTooltip[]
  label?: ReactNode
}
export function TooltipConteudo({ ct, formatter, corItem, active, payload, label }: TooltipConteudoProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, color: ct.tooltipText }}>
      {label != null && label !== "" && <div className="mb-1 font-semibold">{label}</div>}
      <ul className="m-0 grid list-none gap-1 p-0">
        {payload.map((e, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: corItem?.(e) ?? e.color }} />
            <span>{e.name}</span>
            <span className="num ml-auto">{formatter ? formatter(e.value, e.name) : e.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Atalho: passe para <Tooltip content={tooltipColorido(ct, formatter)} />.
export function tooltipColorido(ct: ChartTheme, formatter?: FmtTooltip, corItem?: CorTooltip) {
  return <TooltipConteudo ct={ct} formatter={formatter} corItem={corItem} />
}

// Tooltip acessível em CSS puro: aparece no hover e no foco do teclado.
export function InfoTooltip({ texto }: { texto: string }) {
  return (
    <span className="group/info relative inline-flex align-middle">
      <button
        type="button"
        aria-label={texto}
        className="flex h-4 w-4 items-center justify-center rounded-full border text-[10px] leading-none"
        style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-6 z-20 w-56 max-w-[75vw] -translate-x-1/2 rounded-lg border p-2 text-xs leading-snug opacity-0 shadow-lg transition-opacity duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100"
        style={{ backgroundColor: "rgb(var(--card))", borderColor: "rgb(var(--border))", color: "rgb(var(--foreground))" }}
      >
        {texto}
      </span>
    </span>
  )
}

// Formata o texto da legenda do Recharts com cor legível do tema (o ícone colorido
// continua indicando a série). Evita texto escuro sobre fundo escuro.
export function legendaFormatter(cor: string) {
  const Texto = (value: ReactNode) => <span style={{ color: cor }}>{value}</span>
  Texto.displayName = "LegendaTexto"
  return Texto
}

// Cabeçalho padrão de cada gráfico: título + ⓘ com a explicação do que é o gráfico.
export function ChartTitulo({ titulo, info }: { titulo: string; info: string }) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      <h3 className="text-sm font-semibold">{titulo}</h3>
      <InfoTooltip texto={info} />
    </div>
  )
}

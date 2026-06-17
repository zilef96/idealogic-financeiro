import type { ReactNode } from "react"

// Componentes de moldura dos gráficos: título com tooltip de informação (ⓘ).
// Sem hooks → pode ser usado tanto em server quanto em client components.

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

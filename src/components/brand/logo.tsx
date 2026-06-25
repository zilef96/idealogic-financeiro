/**
 * Marca provisória da Gestão Financeira Idealogic.
 * Placeholder: barras ascendentes (crescimento) num badge arredondado.
 * Substituir pelo logo oficial quando disponível, mantendo a mesma API.
 */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Gestão Financeira Idealogic"
      className={className}
    >
      <rect width="48" height="48" rx="12" className="fill-foreground" />
      {/* barras ascendentes */}
      <rect x="12" y="28" width="6" height="8" rx="1.5" className="fill-background" />
      <rect x="21" y="22" width="6" height="14" rx="1.5" className="fill-background" />
      <rect x="30" y="15" width="6" height="21" rx="1.5" className="fill-background" />
      {/* seta de crescimento */}
      <path
        d="M13 24 L24 18 L35 11"
        className="stroke-pos"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M30 11 H35 V16" className="stroke-pos" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

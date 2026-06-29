// Classes de botão padronizadas da plataforma.
// Tamanho único (h-8, rounded-full, text-[13px]); use `btnPrimary` só na ação primária.

const base =
  "inline-flex h-8 items-center gap-1.5 rounded-full text-[13px] font-medium transition-colors disabled:opacity-60"

/** Secundário/estado: pill com borda e fundo de card. Padrão das ações utilitárias (cadeado, adicionar, expandir/recolher). */
export const btn = `${base} border border-border bg-card px-3 hover:bg-faint`

/** Primário: única ação sólida da página (ex.: Publicar orçamento). */
export const btnPrimary =
  "inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-4 text-[13px] font-semibold text-background transition hover:opacity-90 disabled:opacity-60"

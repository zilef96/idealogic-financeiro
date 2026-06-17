// Paleta semântica única do dashboard — usada em todos os gráficos para manter
// o significado da cor estável entre eles (orçado é sempre o tom fantasma).
// Cores semânticas das séries — escolhidas para ler bem sobre card claro e escuro
// (objetos gráficos ≥ 3:1). As cores estruturais (grade/eixo/tooltip) vêm de
// useChartTheme, pois dependem do tema.
export const C = {
  realizado: "#3b82f6", // azul
  orcado: "#94a3b8",    // cinza fantasma
  pos: "#16a34a",       // superávit / verde
  neg: "#dc2626",       // déficit / vermelho
  acumulado: "#6366f1", // índigo (linha de acumulado)
  ambar: "#d97706",     // atenção
  margem: "#8b5cf6",    // roxo
}

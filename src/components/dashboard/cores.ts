// Paleta semântica única do dashboard — usada em todos os gráficos para manter
// o significado da cor estável entre eles (orçado é sempre o tom fantasma).
// Cores semânticas das séries — escolhidas para ler bem sobre card claro e escuro
// (objetos gráficos ≥ 3:1). As cores estruturais (grade/eixo/tooltip) vêm de
// useChartTheme, pois dependem do tema.
export const C = {
  realizado: "#0097d9", // azul da marca
  orcado: "#9aa1a6",    // cinza fantasma
  pos: "#128a67",       // superávit / verde
  neg: "#c23b32",       // déficit / vermelho
  acumulado: "#6366f1", // índigo (linha de acumulado)
  ambar: "#b9790e",     // atenção
  margem: "#7c5cfc",    // roxo
}

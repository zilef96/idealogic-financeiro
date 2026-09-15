import type { GrupoOrcamento, TipoConta, Classificacao } from "@/lib/types"

// Blocos-raiz (codigoPai null), ordenados por código — início da cascata.
// Não agrupa por tipo: pode haver mais de um bloco-raiz com o mesmo tipo
// (ex.: "Faturamento total" e "Tributos sobre Faturamento" são ambos R), então
// cada bloco precisa ser escolhido individualmente, não só pelo tipo.
export function blocosRaiz(grupos: GrupoOrcamento[]): GrupoOrcamento[] {
  return grupos.filter((g) => g.codigoPai === null).sort((a, b) => Number(a.codigo) - Number(b.codigo))
}

// Filhos diretos de um nó, ordenados por código numérico.
export function filhosDe(grupos: GrupoOrcamento[], codigoPai: string): GrupoOrcamento[] {
  return grupos
    .filter((g) => g.codigoPai === codigoPai)
    .sort((a, b) => Number(a.codigo) - Number(b.codigo))
}

// Folha = nenhum grupo tem este nó como pai (só itens pendurariam abaixo).
export function ehFolha(grupos: GrupoOrcamento[], grupo: GrupoOrcamento): boolean {
  return !grupos.some((g) => g.codigoPai === grupo.codigo)
}

// Classificações ofertadas conforme o bloco: R → Contratado/Projetado; demais → Essencial/Condicionado.
export function classificacoesDoTipo(tipo: TipoConta): { v: Classificacao; nome: string }[] {
  return tipo === "R"
    ? [{ v: "C", nome: "Contratado" }, { v: "P", nome: "Projetado" }]
    : [{ v: "E", nome: "Essencial" }, { v: "S", nome: "Condicionado" }]
}

import type { GrupoOrcamento, TipoConta, Classificacao } from "@/lib/types"

const ORDEM_BLOCOS: TipoConta[] = ["R", "C", "D", "E"]

// Tipos de bloco distintos presentes, na ordem canônica R, C, D, E.
export function blocosDisponiveis(grupos: GrupoOrcamento[]): TipoConta[] {
  const tipos = new Set(grupos.map((g) => g.tipo))
  return ORDEM_BLOCOS.filter((t) => tipos.has(t))
}

// Nó-raiz (codigoPai null) de um bloco. Início da cascata após escolher o tipo.
export function raizDoBloco(grupos: GrupoOrcamento[], tipo: TipoConta): GrupoOrcamento | undefined {
  return grupos.find((g) => g.tipo === tipo && g.codigoPai === null)
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

// Correção estrutural pontual: "Tributos sobre Faturamento" (codigo 10200) tinha
// entrado como subgrupo de "Faturamento total" (10000) na carga inicial do
// orçamento 2026. Deveria ser um 5º bloco-raiz independente, na mesma posição
// da planilha original (Faturamento → Tributos sobre Faturamento → Custos →
// Despesas → Dividendos). Autorizado explicitamente pelo usuário em 2026-09-15.
//
// Único efeito no banco: grupo_pai_id de 10200 vira NULL. Codigo, tipo_conta_id,
// nome e itens (PIS/COFINS/ISSQN/CSLL e IRPJ/Retenção NF) não mudam.
//
// Execução: node scripts/promover-tributos-bloco-2026.ts

import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL })

async function main() {
  const antes = await prisma.$queryRaw<{ id: bigint; grupo_pai_id: bigint | null; nome: string }[]>`
    SELECT id, grupo_pai_id, nome FROM conta_grupo WHERE codigo = 10200`
  if (antes.length !== 1) throw new Error(`Esperava 1 grupo com codigo=10200, encontrei ${antes.length}. Abortando.`)
  if (antes[0].grupo_pai_id === null) {
    console.log("Grupo 10200 já é raiz (grupo_pai_id NULL). Nada a fazer.")
    return
  }
  console.log("Antes:", antes[0])

  await prisma.$executeRaw`UPDATE conta_grupo SET grupo_pai_id = NULL, updated_at = now() WHERE codigo = 10200`

  const depois = await prisma.$queryRaw<{ id: bigint; grupo_pai_id: bigint | null; nome: string }[]>`
    SELECT id, grupo_pai_id, nome FROM conta_grupo WHERE codigo = 10200`
  console.log("Depois:", depois[0])
  console.log("Promoção concluída.")
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(async () => { await prisma.$disconnect() })

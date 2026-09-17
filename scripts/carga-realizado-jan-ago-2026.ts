// Carga pontual do realizado de jan-ago/2026, a partir da planilha 'Execução
// Orçamentária' (aba Execução) que a Larissa usava até 16/09/2026 — a partir de
// 17/09/2026 ela passa a lançar direto pelo sistema. Setembro/2026 em diante já
// está no sistema (lançado manualmente pela Larissa); este script cobre só a
// lacuna jan-ago que estava zerada.
//
// Fonte: planilha 'Orçamento 2026.xlsx', aba 'Execução Orçamentária', colunas
// 'Realizado' de Janeiro a Agosto. Casamento de linha feito por grupo (codigo
// de conta_grupo) + nome do item — itens não têm codigo próprio no schema atual.
// Só grava lançamento quando o valor do mês é != 0 (mesmo padrão que a Larissa
// já usa: setembro tem 46 lançamentos, não 135 = nem todo item se move todo mês).
//
// Não altera valor_orcado/valor_orcado_mensal de NENHUM item existente (autorizado
// explicitamente pelo usuário: 'orçado deixa como está, só o executado').
//
// 6 itens não existem mais no orçamento atual (removidos em algum momento após a
// carga original) mas têm realizado real na planilha legada — criados aqui com
// valor_orcado=0 só pra servir de destino do lançamento, autorizado explicitamente
// pelo usuário: Cred Consorcio (10010), Naces (10020), Alessandro da Silva e
// Cheyenne Bossardi (20100/CLT), Laudir Jaeger e Suélen Ferreira (31200/Terceiros).
//
// Segurança:
// - Confere que nenhum mês jan-ago/2026 está com fechamento_mensal != 'aberto'
//   antes de escrever (trigger do banco bloqueia escrita em mês fechado).
// - Tudo numa única transação: erro no meio desfaz tudo.
// - Idempotente: upsert em lancamento_realizado (on conflict conta_item_id+competencia
//   atualiza valor_realizado); itens novos só são criados se ainda não existirem.
//
// Execução: node scripts/carga-realizado-jan-ago-2026.ts

import "dotenv/config"
import { PrismaClient } from "@prisma/client"

// Conexão direta (não pooled): mesma razão da carga do orçamento — volume de
// inserts numa única transação estoura o timeout do pgbouncer (DATABASE_URL).
const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL })

type ItemExistente = { itemId: number; grupoCodigo: number; itemNome: string; valores: Record<number, number> }
type ItemNovo = { grupoCodigo: number; itemNome: string; classificacao: "C" | "E" | null; valores: Record<number, number> }

// item_id já resolvido por grupo+nome contra o banco atual (ver investigação prévia).
const ITENS_EXISTENTES: ItemExistente[] = [
  { itemId: 12, grupoCodigo: 10010, itemNome: "Corteva", valores: { 1: 1100, 2: 300, 6: 300, 8: 300 } }, // Sublocação Gauten
  { itemId: 13, grupoCodigo: 10020, itemNome: "Bertolini", valores: { 1: 41557.86, 2: 38288.92, 3: 42703.18, 4: 41853.63, 5: 40255.49, 6: 43765.93, 7: 43984.97, 8: 51538.8 } }, // Desenvolvimento
  { itemId: 14, grupoCodigo: 10020, itemNome: "Marke", valores: { 1: 11521.89, 3: 348.19, 5: 99.48, 6: 198.96 } }, // Desenvolvimento
  { itemId: 16, grupoCodigo: 10030, itemNome: "Profigen", valores: { 1: 7283.59, 2: 11450.42, 3: 10223.56, 4: 12224.06, 5: 12831.96, 6: 8267.25, 7: 8499.39, 8: 18337.37 } }, // Suporte
  { itemId: 17, grupoCodigo: 10030, itemNome: "Philip Morris", valores: { 1: 54805.22, 2: 173318.11, 3: 372.72, 4: 4501.16, 5: 13161.47, 6: 50273.73, 7: 698.85, 8: 44393.56 } }, // Suporte
  { itemId: 26, grupoCodigo: 10070, itemNome: "Novo cliente", valores: { 7: 23712.94 } }, // Ressarcimento Guias
  { itemId: 29, grupoCodigo: 10100, itemNome: "Larissa Bittencourt", valores: { 1: 1808, 2: 1808, 3: 1808, 4: 1808, 5: 1808, 6: 1808, 7: 1808, 8: 1809 } }, // Cotas sócios
  { itemId: 30, grupoCodigo: 10100, itemNome: "Feliciano Siquiera", valores: { 1: 1808, 2: 1808, 3: 1808, 4: 1808, 5: 1808, 6: 1808, 7: 1808, 8: 1808 } }, // Cotas sócios
  { itemId: 31, grupoCodigo: 10100, itemNome: "Guilherme Rohr", valores: { 1: 1100, 2: 1100, 3: 1100, 4: 1100, 5: 1100, 6: 1100, 7: 1100, 8: 1100 } }, // Cotas sócios
  { itemId: 32, grupoCodigo: 10100, itemNome: "William Dietter", valores: { 1: 1808, 2: 1808, 3: 1808, 4: 1808, 5: 1808, 6: 1808, 7: 1808, 8: 1808 } }, // Cotas sócios
  { itemId: 33, grupoCodigo: 10100, itemNome: "Charles Goettert", valores: { 1: 1808, 2: 1808, 3: 1808, 4: 1808, 5: 1808, 6: 1808, 7: 1808, 8: 1808 } }, // Cotas sócios
  { itemId: 34, grupoCodigo: 10100, itemNome: "Gabriel Kirst", valores: { 1: 1808, 2: 1808, 3: 1808, 4: 1808, 5: 1808, 6: 1808, 7: 1808, 8: 1808 } }, // Cotas sócios
  { itemId: 35, grupoCodigo: 10100, itemNome: "Guilherme Moreira", valores: { 1: 1808, 2: 1808, 3: 3616, 4: 1808, 6: 1808, 7: 1808, 8: 1808 } }, // Cotas sócios
  { itemId: 36, grupoCodigo: 10100, itemNome: "Kelvin Alves", valores: { 1: 1803, 2: 1811, 3: 1807, 4: 1815, 5: 1807, 6: 1805, 7: 1805, 8: 1805 } }, // Cotas sócios
  { itemId: 37, grupoCodigo: 10100, itemNome: "Sahra Regnet", valores: { 1: 1808, 2: 1808, 3: 1808, 4: 1808, 6: 1808, 7: 1808, 8: 1808 } }, // Cotas sócios
  { itemId: 38, grupoCodigo: 10200, itemNome: "PIS", valores: { 1: 2127.87, 3: 16.24, 5: 17.9, 7: 20.88, 8: 32.11 } }, // Tributos sobre Faturamento
  { itemId: 39, grupoCodigo: 10200, itemNome: "COFINS", valores: { 1: 9802.12, 2: 53.94, 3: 45.95, 4: 59.35, 5: 50.85, 6: 51.72, 7: 76.8, 8: 197.58 } }, // Tributos sobre Faturamento
  { itemId: 40, grupoCodigo: 10200, itemNome: "ISSQN", valores: { 1: 4237.88, 2: 1631.23, 3: 1108.28, 4: 1164.76, 5: 2214.11, 6: 1957.92, 7: 2043.35, 8: 3114.95 } }, // Tributos sobre Faturamento
  { itemId: 41, grupoCodigo: 10200, itemNome: "CSLL e IRPJ", valores: { 8: 7551.24 } }, // Tributos sobre Faturamento
  { itemId: 42, grupoCodigo: 10200, itemNome: "Retenção NF", valores: { 2: 1210.34, 4: 3811.67 } }, // Tributos sobre Faturamento
  { itemId: 45, grupoCodigo: 20200, itemNome: "Guilherme Rohr", valores: { 1: 1351.02, 2: 1442.69, 3: 1442.69, 4: 1442.69, 5: 1442.69, 6: 1442.69, 7: 1442.69, 8: 1442.69 } }, // Pró-labore
  { itemId: 46, grupoCodigo: 20200, itemNome: "Feliciano de Vargas", valores: { 1: 1351.02, 2: 1442.69, 3: 1442.69, 4: 1442.69, 5: 1442.69, 6: 1442.69, 7: 1442.69, 8: 1442.69 } }, // Pró-labore
  { itemId: 47, grupoCodigo: 20200, itemNome: "Larissa Bittencourt", valores: { 1: 1351.02, 2: 1442.69, 3: 1442.69, 4: 1442.69, 5: 1442.69, 6: 1442.69, 7: 1442.69, 8: 1442.69 } }, // Pró-labore
  { itemId: 48, grupoCodigo: 20300, itemNome: "Iuri Ellwanger", valores: { 1: 7444.29, 2: 16643.18, 3: 7179.54, 4: 7711.53, 5: 8411.9, 7: 8397.72, 8: 10333.01 } }, // PJ
  { itemId: 49, grupoCodigo: 20300, itemNome: "Emiliano", valores: { 8: 11450.74 } }, // PJ
  { itemId: 58, grupoCodigo: 20400, itemNome: "FGTS", valores: { 1: 3503.61, 2: 1981.98, 3: 1987.31, 4: 2038.46, 5: 2064.73, 6: 2455.54, 7: 2833, 8: 1371.35 } }, // Tributos, Encargos e Provisões
  { itemId: 59, grupoCodigo: 20400, itemNome: "INSS + IR", valores: { 1: 22925.49, 2: 11975.9, 3: 14229.73, 4: 13516.41, 5: 14717.17, 6: 16412.1, 7: 14711.92, 8: 19294.22 } }, // Tributos, Encargos e Provisões
  { itemId: 63, grupoCodigo: 20400, itemNome: "Férias", valores: { 2: 3340.43, 5: 4924.06 } }, // Tributos, Encargos e Provisões
  { itemId: 65, grupoCodigo: 20400, itemNome: "Rescisão", valores: { 7: 15787.47 } }, // Tributos, Encargos e Provisões
  { itemId: 66, grupoCodigo: 20500, itemNome: "Unimed", valores: { 1: 2073.54, 2: 2027.54, 3: 1972.54, 4: 1972.54, 5: 2281.06, 6: 2486.56, 7: 2431.56 } }, // Benefícios
  { itemId: 67, grupoCodigo: 20500, itemNome: "CAJU", valores: { 1: 2655.62, 2: 3029.7, 3: 2737.38, 4: 2554.94, 5: 3493.27, 6: 2096.47, 7: 4074.58 } }, // Benefícios
  { itemId: 68, grupoCodigo: 20500, itemNome: "Uniodonto", valores: { 1: 25.6, 2: 25.6, 3: 25.6, 4: 25.6, 5: 25.6, 6: 25.76, 7: 25.76 } }, // Benefícios
  { itemId: 69, grupoCodigo: 31200, itemNome: "Laura Pillon", valores: { 1: 2596, 2: 2596, 3: 2436, 4: 3836.7, 5: 3836.7, 7: 3836.7, 8: 4075.7 } }, // Terceiros (PJ e MEI)
  { itemId: 74, grupoCodigo: 31400, itemNome: "Aulas de inglês", valores: { 1: 400 } }, // Treinamento e qualidade de vida
  { itemId: 81, grupoCodigo: 32100, itemNome: "Day Office", valores: { 1: 279.79, 3: 165.2, 4: 86.27, 5: 50.53 } }, // Despesas diversas
  { itemId: 85, grupoCodigo: 32100, itemNome: "Reuniões de relacionamento", valores: { 2: 112.53 } }, // Despesas diversas
  { itemId: 90, grupoCodigo: 32100, itemNome: "Material de escritório + diversos", valores: { 2: 30, 3: 199, 5: 43.5 } }, // Despesas diversas
  { itemId: 91, grupoCodigo: 32100, itemNome: "Presentes", valores: { 1: 900, 2: 900, 3: 15 } }, // Despesas diversas
  { itemId: 92, grupoCodigo: 33100, itemNome: "Amazon", valores: { 1: 224.73, 2: 239.12, 3: 234.63, 4: 210.28, 5: 226.84, 6: 215.5, 7: 216.29, 8: 503.61 } }, // Serviços cloud
  { itemId: 93, grupoCodigo: 33200, itemNome: "Conta Azul", valores: { 1: 390.4, 2: 390.4, 3: 390.4, 4: 390.4, 5: 390.4, 6: 390.4, 7: 390.4, 8: 390.4 } }, // SaaS e licenças
  { itemId: 96, grupoCodigo: 33200, itemNome: "ClickSign (assinatura digital)", valores: { 1: 172.86, 2: 172.86, 3: 172.86, 4: 180.22, 5: 180.22, 6: 180.22, 7: 180.22, 8: 180.22 } }, // SaaS e licenças
  { itemId: 97, grupoCodigo: 33200, itemNome: "Google Workspace", valores: { 1: 1960, 2: 1960, 3: 1960, 4: 1960, 5: 1984.37, 6: 1932, 7: 1883, 8: 1883 } }, // SaaS e licenças
  { itemId: 98, grupoCodigo: 33200, itemNome: "Slack", valores: { 1: 479.48, 2: 481.68, 3: 520.55, 4: 434.82, 5: 385.16, 6: 314.22, 7: 428.76, 8: 387.33 } }, // SaaS e licenças
  { itemId: 99, grupoCodigo: 33200, itemNome: "Jira + Confluence", valores: { 1: 400.91, 2: 134.75, 3: 83.18, 4: 82.75, 5: 79.05, 6: 80.58, 7: 80.56, 8: 81.41 } }, // SaaS e licenças
  { itemId: 100, grupoCodigo: 33200, itemNome: "Adobe", valores: { 1: 95, 2: 95, 3: 95, 4: 95, 5: 95, 6: 95, 7: 95, 8: 95 } }, // SaaS e licenças
  { itemId: 102, grupoCodigo: 33200, itemNome: "Canva", valores: { 1: 24.15, 2: 24.15, 3: 24.15, 4: 24.15, 5: 24.15, 6: 24.15, 7: 24.15, 8: 24.25 } }, // SaaS e licenças
  { itemId: 104, grupoCodigo: 33200, itemNome: "Ésses", valores: { 1: 169, 2: 169, 3: 169 } }, // SaaS e licenças
  { itemId: 105, grupoCodigo: 33200, itemNome: "Embraoffice", valores: { 1: 119, 2: 119, 3: 123.65, 4: 123.65, 5: 123.65, 6: 123.65, 7: 123.65, 8: 126.16 } }, // SaaS e licenças
  { itemId: 106, grupoCodigo: 33300, itemNome: "Escritório contábil", valores: { 1: 4125, 2: 2750, 3: 2036.66, 4: 2750, 5: 2750, 6: 2870, 7: 2870, 8: 2870 } }, // Assessorias
  { itemId: 107, grupoCodigo: 33300, itemNome: "Escritório juridico", valores: { 1: 2570, 2: 2680, 3: 2680, 4: 2680, 5: 2680, 6: 5360 } }, // Assessorias
  { itemId: 110, grupoCodigo: 33300, itemNome: "Clínica São Vicente (saúde)", valores: { 1: 70, 2: 70, 3: 70, 4: 70, 5: 70, 6: 70, 7: 70, 8: 71.42 } }, // Assessorias
  { itemId: 112, grupoCodigo: 34200, itemNome: "Tarifas bancárias Sicredi", valores: { 1: 188.18, 2: 174.13, 3: 171.73, 4: 173.32, 5: 184.68, 6: 119.91, 7: 124.93, 8: 139.21 } }, // Despesas bancárias
  { itemId: 114, grupoCodigo: 34200, itemNome: "Seguro empresarial", valores: { 1: 865.71, 2: 865.71, 3: 865.71, 4: 865.71, 5: 865.71, 6: 865.71, 7: 865.71, 8: 815.3 } }, // Despesas bancárias
  { itemId: 116, grupoCodigo: 34200, itemNome: "Tarifas Bancarias Banrisul", valores: { 1: 154, 2: 79, 3: 79, 4: 154, 5: 79, 6: 79, 7: 79 } }, // Despesas bancárias
  { itemId: 117, grupoCodigo: 35100, itemNome: "Ativales", valores: { 1: 164.61, 2: 164.61, 3: 164.61, 4: 164.61, 5: 164.61, 6: 164.61, 7: 164.61, 8: 164.61 } }, // Marketing Social Institucional
  { itemId: 118, grupoCodigo: 35100, itemNome: "ACI", valores: { 1: 83.5, 2: 83.5, 3: 83.5, 4: 83.5, 5: 83.5, 6: 83.5, 7: 83.5, 8: 83.5 } }, // Marketing Social Institucional
  { itemId: 125, grupoCodigo: 35200, itemNome: "Viagens no RS (combustivel & Cia)", valores: { 1: 240, 2: 483.9, 4: 240, 7: 256, 8: 480 } }, // Marketing Comercial
  { itemId: 132, grupoCodigo: 35200, itemNome: "ACATE", valores: { 1: 99.48, 2: 99.48, 3: 99.48, 4: 99.48, 5: 149.22, 6: 149.22, 7: 149.22, 8: 149.22 } }, // Marketing Comercial
  { itemId: 133, grupoCodigo: 35200, itemNome: "Marciely MKT", valores: { 3: 1597, 4: 1597, 5: 1597, 6: 1597, 7: 1597, 8: 1597 } }, // Marketing Comercial
  { itemId: 134, grupoCodigo: 35200, itemNome: "Ferramentas (RD Station)", valores: { 1: 1467.98, 2: 1525.1, 3: 1426.7, 4: 1467.25, 5: 1491.5, 6: 50, 7: 79, 8: 79 } }, // Marketing Comercial
  { itemId: 135, grupoCodigo: 35200, itemNome: "Telefone Celular", valores: { 1: 102.92, 2: 102.92, 3: 102.92, 4: 102.92, 5: 108.59, 6: 94.98, 7: 94.98, 8: 65.61 } }, // Marketing Comercial
  { itemId: 140, grupoCodigo: 35200, itemNome: "Apollo", valores: { 5: 297.52, 6: 301.84 } }, // Marketing Comercial
  { itemId: 141, grupoCodigo: 36100, itemNome: "Internet", valores: { 1: 120, 2: 120, 3: 120, 4: 120, 5: 120, 6: 120, 7: 120, 8: 120 } }, // Gauten Instalações
  { itemId: 142, grupoCodigo: 36100, itemNome: "Mercado", valores: { 1: 96, 2: 48, 3: 87.78, 6: 24, 8: 48 } }, // Gauten Instalações
  { itemId: 143, grupoCodigo: 36100, itemNome: "Limpeza", valores: { 1: 130, 3: 130, 7: 130, 8: 130 } }, // Gauten Instalações
  { itemId: 145, grupoCodigo: 36100, itemNome: "Aluguel", valores: { 1: 975.68, 2: 1025.73, 3: 1025.73, 4: 1025.73, 5: 1025.73, 6: 1025.73, 7: 1025.73, 8: 1025.73 } }, // Gauten Instalações
  { itemId: 147, grupoCodigo: 37100, itemNome: "Manutenção equipamentos", valores: { 3: 969 } }, // Computadores
  { itemId: 148, grupoCodigo: 41000, itemNome: "Guilherme Rohr", valores: { 1: 14574.73, 2: 14483.06, 3: 14483.06, 4: 14323.06, 5: 15111.35, 6: 15111.35, 7: 15111.35, 8: 15111.35 } }, // Distribuição de lucros
  { itemId: 149, grupoCodigo: 41000, itemNome: "Feliciano de Vargas", valores: { 1: 3337.11, 2: 3245.44, 3: 3245.44, 4: 3416.56, 5: 3311.85, 6: 3358.75, 7: 3311.85, 8: 3311.85 } }, // Distribuição de lucros
  { itemId: 150, grupoCodigo: 41000, itemNome: "Larissa Bittencourt", valores: { 1: 4846.48, 2: 4754.81, 3: 4754.81, 4: 4594.81, 5: 4896.69, 6: 4896.69, 7: 4896.69, 8: 4896.69 } }, // Distribuição de lucros
]

// Itens sem conta_item hoje — autorizado pelo usuário criar com valor_orcado=0.
const ITENS_NOVOS: ItemNovo[] = [
  { grupoCodigo: 10010, itemNome: "Cred Consorcio", classificacao: null, valores: { 1: 30, 2: 30, 3: 30, 4: 30, 5: 30, 6: 30, 7: 30, 8: 30 } }, // Sublocação Gauten
  { grupoCodigo: 10020, itemNome: "Naces", classificacao: "C", valores: { 8: 4692.5 } }, // Desenvolvimento
  { grupoCodigo: 20100, itemNome: "Alessandro da Silva", classificacao: "E", valores: { 1: 9601.4, 2: 6100.76, 3: 5940.3, 4: 5980.09, 5: 6079.88, 6: 3839.06, 7: 23117.51 } }, // CLT
  { grupoCodigo: 20100, itemNome: "Cheyenne Bossardi", classificacao: "E", valores: { 1: 14365.16, 2: 11877.98, 3: 9691.07, 4: 12530.09, 5: 12652.21, 6: 14973.67, 7: 66571.92 } }, // CLT
  { grupoCodigo: 31200, itemNome: "Laudir Jaeger", classificacao: "E", valores: { 1: 2425, 2: 2425 } }, // Terceiros (PJ e MEI)
  { grupoCodigo: 31200, itemNome: "Suélen Ferreira", classificacao: "E", valores: { 1: 4770.16, 2: 5016.25, 3: 2898.33 } }, // Terceiros (PJ e MEI)
]

async function main() {
  const exercicio = await prisma.$queryRaw<{ id: bigint; ano: number; status: string }[]>`
    SELECT id, ano, status FROM exercicio WHERE ano = 2026`
  if (exercicio.length !== 1) {
    throw new Error(`Esperava exatamente 1 exercício ano=2026, encontrei ${exercicio.length}. Abortando.`)
  }
  const exercicioId = exercicio[0].id
  console.log(`Exercício 2026: id=${exercicioId} status=${exercicio[0].status}`)

  // Trava de segurança: nenhum mês jan-ago pode estar fechado (trigger do banco bloqueia
  // escrita em lancamento_realizado de mês com fechamento_mensal.status != 'aberto').
  const fechamentos = await prisma.$queryRaw<{ competencia: Date; status: string }[]>`
    SELECT competencia, status FROM fechamento_mensal
    WHERE exercicio_id = ${exercicioId}
      AND competencia >= '2026-01-01' AND competencia <= '2026-08-01'
      AND status != 'aberto'`
  if (fechamentos.length > 0) {
    throw new Error(
      `Existem meses jan-ago/2026 não abertos: ${fechamentos.map((f) => `${f.competencia.toISOString().slice(0, 7)}:${f.status}`).join(", ")}. Abortando.`,
    )
  }

  // Confere que os item_id hardcoded ainda existem e pertencem ao grupo esperado.
  const grupoIdPorCodigo = new Map<number, bigint>()
  const grupos = await prisma.$queryRaw<{ id: bigint; codigo: string }[]>`
    SELECT id, codigo::text AS codigo FROM conta_grupo WHERE exercicio_id = ${exercicioId}`
  for (const g of grupos) grupoIdPorCodigo.set(Number(g.codigo), g.id)

  for (const it of ITENS_EXISTENTES) {
    const grupoId = grupoIdPorCodigo.get(it.grupoCodigo)
    if (!grupoId) throw new Error(`Grupo codigo=${it.grupoCodigo} não encontrado (item "${it.itemNome}"). Abortando.`)
    const conferido = await prisma.$queryRaw<{ id: bigint; nome: string; grupo_id: bigint }[]>`
      SELECT id, nome, grupo_id FROM conta_item WHERE id = ${it.itemId}`
    if (conferido.length !== 1) throw new Error(`conta_item id=${it.itemId} ("${it.itemNome}") não encontrado. Abortando.`)
    if (conferido[0].grupo_id !== grupoId) {
      throw new Error(`conta_item id=${it.itemId} ("${it.itemNome}") está em grupo_id=${conferido[0].grupo_id}, esperado ${grupoId} (codigo ${it.grupoCodigo}). Abortando.`)
    }
    if (conferido[0].nome.trim() !== it.itemNome) {
      throw new Error(`conta_item id=${it.itemId} tem nome "${conferido[0].nome}", esperado "${it.itemNome}". Abortando.`)
    }
  }

  for (const it of ITENS_NOVOS) {
    if (!grupoIdPorCodigo.has(it.grupoCodigo)) {
      throw new Error(`Grupo codigo=${it.grupoCodigo} não encontrado (item novo "${it.itemNome}"). Abortando.`)
    }
  }

  let itensNovosCriados = 0
  let itensNovosReaproveitados = 0
  let lancamentosGravados = 0

  await prisma.$transaction(async (tx) => {
    // Resolve (ou cria) os itens novos primeiro, pra ter o id na hora de gravar o realizado.
    const idPorItemNovo = new Map<string, bigint>()
    for (const it of ITENS_NOVOS) {
      const grupoId = grupoIdPorCodigo.get(it.grupoCodigo)!
      const existente = await tx.$queryRaw<{ id: bigint }[]>`
        SELECT id FROM conta_item WHERE grupo_id = ${grupoId} AND nome = ${it.itemNome}`
      if (existente[0]) {
        idPorItemNovo.set(`${it.grupoCodigo}::${it.itemNome}`, existente[0].id)
        itensNovosReaproveitados++
        continue
      }
      const criado = await tx.$queryRaw<{ id: bigint }[]>`
        INSERT INTO conta_item (grupo_id, nome, periodicidade, valor_orcado, valor_orcado_mensal, classificacao, origem)
        VALUES (${grupoId}, ${it.itemNome}, 'M', 0::numeric, 0::numeric, ${it.classificacao}, 'orcamento')
        RETURNING id`
      idPorItemNovo.set(`${it.grupoCodigo}::${it.itemNome}`, criado[0].id)
      itensNovosCriados++
    }

    // Grava o realizado dos itens já existentes.
    for (const it of ITENS_EXISTENTES) {
      for (const [mes, valor] of Object.entries(it.valores)) {
        const competencia = `2026-${String(mes).padStart(2, "0")}-01`
        await tx.$executeRaw`
          INSERT INTO lancamento_realizado (conta_item_id, exercicio_id, competencia, valor_realizado)
          VALUES (${it.itemId}, ${exercicioId}, ${competencia}::date, ${valor}::numeric)
          ON CONFLICT (conta_item_id, competencia)
          DO UPDATE SET valor_realizado = EXCLUDED.valor_realizado, updated_at = now()`
        lancamentosGravados++
      }
    }

    // Grava o realizado dos itens novos.
    for (const it of ITENS_NOVOS) {
      const itemId = idPorItemNovo.get(`${it.grupoCodigo}::${it.itemNome}`)!
      for (const [mes, valor] of Object.entries(it.valores)) {
        const competencia = `2026-${String(mes).padStart(2, "0")}-01`
        await tx.$executeRaw`
          INSERT INTO lancamento_realizado (conta_item_id, exercicio_id, competencia, valor_realizado)
          VALUES (${itemId}, ${exercicioId}, ${competencia}::date, ${valor}::numeric)
          ON CONFLICT (conta_item_id, competencia)
          DO UPDATE SET valor_realizado = EXCLUDED.valor_realizado, updated_at = now()`
        lancamentosGravados++
      }
    }
  }, { timeout: 120_000 })

  console.log(`Itens novos criados: ${itensNovosCriados}`)
  console.log(`Itens novos reaproveitados (já existiam, script rodou de novo): ${itensNovosReaproveitados}`)
  console.log(`Lançamentos gravados (insert ou update): ${lancamentosGravados}`)
  console.log("\nCarga de realizado jan-ago/2026 concluída.")
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(async () => { await prisma.$disconnect() })

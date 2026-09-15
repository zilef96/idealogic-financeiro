// Carga inicial pontual do Orçamento 2026 a partir da planilha fornecida pela Larissa.
// Roda uma vez, direto no exercício em rascunho: reaproveita os 4 blocos-raiz já
// existentes (10000/20000/30000/40000) e recria os grupos/subgrupos/itens do plano
// (origem='orcamento') a partir dos dados abaixo. Não é uma feature de importação —
// os dados vêm hardcoded aqui mesmo, exatamente como pedido.
//
// Execução: node scripts/carga-orcamento-2026.ts
//
// Segurança:
// - Só mexe em conta_grupo/conta_item com origem='orcamento' do exercício em rascunho.
// - Nunca apaga conta_item referenciado por lancamento_realizado (a query de limpeza
//   exclui explicitamente qualquer item com histórico de execução).
// - Tudo dentro de uma única transação: erro no meio desfaz tudo.
// - Idempotente: pode rodar de novo (limpa e recria o que não está "travado" por
//   histórico de execução antes de reinserir).

import "dotenv/config"
import { PrismaClient } from "@prisma/client"

// Conexão direta (não pooled): a carga faz ~180 statements numa única transação,
// o que estoura o timeout padrão via pgbouncer (DATABASE_URL, modo transaction).
const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL })

type Item = {
  codigo: number
  nome: string
  periodicidade: "M" | "A"
  valorOrcado: number
  valorOrcadoMensal: number
  classificacao: "C" | "P" | "E" | "S" | null
}
type Grupo = { codigo: number; nome: string; itens?: Item[]; subgrupos?: Grupo[] }
type Bloco = { codigoRaiz: number; tipo: "R" | "C" | "D" | "E"; grupos: Grupo[] }

const BLOCOS: Bloco[] = [
  {
    codigoRaiz: 10000, tipo: "R", grupos: [
      { codigo: 10010, nome: "Sublocação Gauten", itens: [
        { codigo: 10011, nome: "Corteva", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
      ] },
      { codigo: 10020, nome: "Desenvolvimento", itens: [
        { codigo: 10021, nome: "Bertolini", periodicidade: "M", valorOrcado: 44280.68, valorOrcadoMensal: 44280.68, classificacao: "C" },
        { codigo: 10022, nome: "Marke", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "C" },
        { codigo: 10023, nome: "Novo cliente", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
      ] },
      { codigo: 10030, nome: "Suporte", itens: [
        { codigo: 10031, nome: "Profigen", periodicidade: "M", valorOrcado: 10610.30, valorOrcadoMensal: 10610.30, classificacao: "C" },
        { codigo: 10032, nome: "Philip Morris", periodicidade: "M", valorOrcado: 42795.60, valorOrcadoMensal: 42795.60, classificacao: "C" },
        { codigo: 10033, nome: "Novo cliente", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
        { codigo: 10034, nome: "Novo cliente", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
      ] },
      { codigo: 10040, nome: "Qualidade de software", itens: [
        { codigo: 10041, nome: "Novo cliente", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
        { codigo: 10042, nome: "Novo cliente", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
      ] },
      { codigo: 10050, nome: "Data Analytics", itens: [
        { codigo: 10051, nome: "Novo cliente", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
        { codigo: 10052, nome: "Novo cliente", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
        { codigo: 10053, nome: "Novo cliente", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
      ] },
      { codigo: 10060, nome: "Cultura & Pessoas", itens: [
        { codigo: 10061, nome: "Novos clientes", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
      ] },
      { codigo: 10070, nome: "Ressarcimento Guias", itens: [
        { codigo: 10071, nome: "Novo cliente", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
        { codigo: 10072, nome: "Novo cliente", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
        { codigo: 10073, nome: "Novo cliente", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
      ] },
      { codigo: 10100, nome: "Cotas sócios", itens: [
        { codigo: 10110, nome: "Larissa Bittencourt", periodicidade: "M", valorOrcado: 1808, valorOrcadoMensal: 1808, classificacao: "C" },
        { codigo: 10120, nome: "Feliciano Siquiera", periodicidade: "M", valorOrcado: 1808, valorOrcadoMensal: 1808, classificacao: "C" },
        { codigo: 10130, nome: "Guilherme Rohr", periodicidade: "M", valorOrcado: 1100, valorOrcadoMensal: 1100, classificacao: "C" },
        { codigo: 10140, nome: "William Dietter", periodicidade: "M", valorOrcado: 1808, valorOrcadoMensal: 1808, classificacao: "C" },
        { codigo: 10150, nome: "Charles Goettert", periodicidade: "M", valorOrcado: 1808, valorOrcadoMensal: 1808, classificacao: "C" },
        { codigo: 10160, nome: "Gabriel Kirst", periodicidade: "M", valorOrcado: 1808, valorOrcadoMensal: 1808, classificacao: "C" },
        { codigo: 10170, nome: "Guilherme Moreira", periodicidade: "M", valorOrcado: 1808, valorOrcadoMensal: 1808, classificacao: "C" },
        { codigo: 10180, nome: "Kelvin Alves", periodicidade: "M", valorOrcado: 1808, valorOrcadoMensal: 1808, classificacao: "C" },
        { codigo: 10190, nome: "Sahra Regnet", periodicidade: "M", valorOrcado: 1808, valorOrcadoMensal: 1808, classificacao: "C" },
      ] },
      { codigo: 10200, nome: "Tributos sobre Faturamento", itens: [
        { codigo: 10201, nome: "PIS", periodicidade: "M", valorOrcado: 1087.25, valorOrcadoMensal: 1087.25, classificacao: "C" },
        { codigo: 10202, nome: "COFINS", periodicidade: "M", valorOrcado: 5001.33, valorOrcadoMensal: 5001.33, classificacao: "C" },
        { codigo: 10203, nome: "ISSQN", periodicidade: "M", valorOrcado: 2174.49, valorOrcadoMensal: 2174.49, classificacao: "C" },
        { codigo: 10204, nome: "CSLL e IRPJ", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "C" },
        { codigo: 10205, nome: "Retenção NF", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "C" },
      ] },
    ],
  },
  {
    codigoRaiz: 20000, tipo: "C", grupos: [
      { codigo: 20100, nome: "CLT", itens: [
        { codigo: 20101, nome: "Alessandro da Silva", periodicidade: "M", valorOrcado: 6906.98, valorOrcadoMensal: 6906.98, classificacao: "E" },
        { codigo: 20102, nome: "Cheyenne Bossardi", periodicidade: "M", valorOrcado: 12483.10, valorOrcadoMensal: 12483.10, classificacao: "E" },
      ] },
      { codigo: 20200, nome: "Pró-labore", itens: [
        { codigo: 20201, nome: "Guilherme Rohr", periodicidade: "M", valorOrcado: 1442.69, valorOrcadoMensal: 1442.69, classificacao: "E" },
        { codigo: 20202, nome: "Feliciano de Vargas", periodicidade: "M", valorOrcado: 1442.69, valorOrcadoMensal: 1442.69, classificacao: "E" },
        { codigo: 20203, nome: "Larissa Bittencourt", periodicidade: "M", valorOrcado: 1442.69, valorOrcadoMensal: 1442.69, classificacao: "E" },
      ] },
      { codigo: 20300, nome: "PJ", itens: [
        { codigo: 20301, nome: "Iuri Ellwanger", periodicidade: "M", valorOrcado: 9188.05, valorOrcadoMensal: 9188.05, classificacao: "E" },
        { codigo: 20302, nome: "Nova contratação", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        { codigo: 20303, nome: "Nova contratação", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        { codigo: 20304, nome: "Nova contratação", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        { codigo: 20305, nome: "Nova contratação", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        { codigo: 20306, nome: "Nova contratação", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        { codigo: 20307, nome: "Nova contratação", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        { codigo: 20308, nome: "Nova contratação", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        { codigo: 20309, nome: "Nova contratação", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        { codigo: 20310, nome: "Nova contratação", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
      ] },
      { codigo: 20400, nome: "Tributos, Encargos e Provisões", itens: [
        { codigo: 20401, nome: "FGTS", periodicidade: "M", valorOrcado: 1944.00, valorOrcadoMensal: 862.76, classificacao: "E" },
        { codigo: 20402, nome: "INSS + IR", periodicidade: "M", valorOrcado: 11664.00, valorOrcadoMensal: 6085.19, classificacao: "E" },
        { codigo: 20403, nome: "Provisão de Férias", periodicidade: "M", valorOrcado: 2000, valorOrcadoMensal: 2000, classificacao: "E" },
        { codigo: 20404, nome: "Provisão de 13.salário", periodicidade: "M", valorOrcado: 2000, valorOrcadoMensal: 2000, classificacao: "E" },
        { codigo: 20405, nome: "Provisão de rescisão", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        { codigo: 20406, nome: "Férias", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        { codigo: 20407, nome: "13. salário", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        { codigo: 20408, nome: "Rescisão", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
      ] },
      { codigo: 20500, nome: "Benefícios", itens: [
        { codigo: 20501, nome: "Unimed", periodicidade: "M", valorOrcado: 1972.54, valorOrcadoMensal: 1803.80, classificacao: "E" },
        { codigo: 20502, nome: "CAJU", periodicidade: "M", valorOrcado: 1470, valorOrcadoMensal: 1470, classificacao: "E" },
        { codigo: 20503, nome: "Uniodonto", periodicidade: "M", valorOrcado: 25.60, valorOrcadoMensal: 25.60, classificacao: "E" },
      ] },
    ],
  },
  {
    codigoRaiz: 30000, tipo: "D", grupos: [
      { codigo: 31000, nome: "Pessoal", subgrupos: [
        { codigo: 31100, nome: "CLT", itens: [] },
        { codigo: 31200, nome: "Terceiros (PJ e MEI)", itens: [
          { codigo: 31201, nome: "Laura Pillon", periodicidade: "M", valorOrcado: 3758.40, valorOrcadoMensal: 3758.40, classificacao: "E" },
          { codigo: 31202, nome: "Laudir Jaeger", periodicidade: "M", valorOrcado: 2494.80, valorOrcadoMensal: 2494.80, classificacao: "E" },
          { codigo: 31203, nome: "Suélen Ferreira", periodicidade: "M", valorOrcado: 5670, valorOrcadoMensal: 5670, classificacao: "E" },
          { codigo: 31204, nome: "Nova contratação MKT", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        ] },
        { codigo: 31300, nome: "Pró-labores", itens: [] },
        { codigo: 31400, nome: "Treinamento e qualidade de vida", itens: [
          { codigo: 31401, nome: "Cursos e treinamentos", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 31402, nome: "Aulas de inglês", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 31403, nome: "Coworking", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 31404, nome: "Hygia Saúde", periodicidade: "A", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "S" },
          { codigo: 31405, nome: "WellHub", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "S" },
        ] },
      ] },
      { codigo: 32000, nome: "Cultura & Pessoas", subgrupos: [
        { codigo: 32100, nome: "Despesas diversas", itens: [
          { codigo: 32101, nome: "Auxílio verão", periodicidade: "A", valorOrcado: 4050, valorOrcadoMensal: 337.50, classificacao: "E" },
          { codigo: 32102, nome: "Gauten Summit", periodicidade: "A", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "S" },
          { codigo: 32103, nome: "TDC 2026", periodicidade: "A", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "S" },
          { codigo: 32104, nome: "Day Office", periodicidade: "M", valorOrcado: 250, valorOrcadoMensal: 250, classificacao: "E" },
          { codigo: 32105, nome: "Idealogic Meeting", periodicidade: "A", valorOrcado: 3000, valorOrcadoMensal: 250, classificacao: "S" },
          { codigo: 32106, nome: "Aniversário 22 anos", periodicidade: "A", valorOrcado: 5000, valorOrcadoMensal: 416.67, classificacao: "S" },
          { codigo: 32107, nome: "Final de ano Idealogic", periodicidade: "A", valorOrcado: 5000, valorOrcadoMensal: 416.67, classificacao: "E" },
          { codigo: 32108, nome: "Reuniões de relacionamento", periodicidade: "M", valorOrcado: 150, valorOrcadoMensal: 150, classificacao: "E" },
          { codigo: 32109, nome: "Compensação carbono zero", periodicidade: "A", valorOrcado: 2000, valorOrcadoMensal: 166.67, classificacao: "E" },
          { codigo: 32110, nome: "Camisetas", periodicidade: "A", valorOrcado: 1500, valorOrcadoMensal: 125, classificacao: "S" },
          { codigo: 32111, nome: "Casacos ou moletons", periodicidade: "A", valorOrcado: 3500, valorOrcadoMensal: 291.67, classificacao: "S" },
          { codigo: 32112, nome: "Gratificação", periodicidade: "A", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "S" },
          { codigo: 32113, nome: "Material de escritório + diversos", periodicidade: "M", valorOrcado: 50, valorOrcadoMensal: 50, classificacao: "E" },
          { codigo: 32114, nome: "Presentes", periodicidade: "A", valorOrcado: 1800, valorOrcadoMensal: 150, classificacao: "S" },
        ] },
      ] },
      { codigo: 33000, nome: "Custos operacionais", subgrupos: [
        { codigo: 33100, nome: "Serviços cloud", itens: [
          { codigo: 33101, nome: "Amazon", periodicidade: "M", valorOrcado: 242, valorOrcadoMensal: 242, classificacao: "E" },
        ] },
        { codigo: 33200, nome: "SaaS e licenças", itens: [
          { codigo: 33201, nome: "Conta Azul", periodicidade: "M", valorOrcado: 354.90, valorOrcadoMensal: 354.90, classificacao: "E" },
          { codigo: 33202, nome: "Ponto", periodicidade: "M", valorOrcado: 50, valorOrcadoMensal: 50, classificacao: "E" },
          { codigo: 33203, nome: "Feedz", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 33204, nome: "ClickSign (assinatura digital)", periodicidade: "M", valorOrcado: 172.86, valorOrcadoMensal: 172.86, classificacao: "E" },
          { codigo: 33205, nome: "Google Workspace", periodicidade: "M", valorOrcado: 2171.41, valorOrcadoMensal: 2171.41, classificacao: "E" },
          { codigo: 33206, nome: "Slack", periodicidade: "M", valorOrcado: 543, valorOrcadoMensal: 543, classificacao: "E" },
          { codigo: 33207, nome: "Jira + Confluence", periodicidade: "M", valorOrcado: 210, valorOrcadoMensal: 210, classificacao: "E" },
          { codigo: 33208, nome: "Adobe", periodicidade: "M", valorOrcado: 95, valorOrcadoMensal: 95, classificacao: "E" },
          { codigo: 33209, nome: "Gather", periodicidade: "A", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 33210, nome: "Canva", periodicidade: "M", valorOrcado: 24.15, valorOrcadoMensal: 24.15, classificacao: "E" },
          { codigo: 33211, nome: "Linkedin helper", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 33212, nome: "Ésses", periodicidade: "M", valorOrcado: 169, valorOrcadoMensal: 169, classificacao: "E" },
          { codigo: 33213, nome: "Embraoffice", periodicidade: "M", valorOrcado: 119, valorOrcadoMensal: 119, classificacao: "E" },
        ] },
        { codigo: 33300, nome: "Assessorias", itens: [
          { codigo: 33301, nome: "Escritório contábil", periodicidade: "M", valorOrcado: 2750, valorOrcadoMensal: 2750, classificacao: "E" },
          { codigo: 33302, nome: "Escritório juridico", periodicidade: "M", valorOrcado: 2570, valorOrcadoMensal: 2570, classificacao: "E" },
          { codigo: 33303, nome: "Consultoria financeira", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 33304, nome: "Consultoria ESG", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "S" },
          { codigo: 33305, nome: "Clínica São Vicente (saúde)", periodicidade: "M", valorOrcado: 70, valorOrcadoMensal: 70, classificacao: "E" },
        ] },
      ] },
      { codigo: 34000, nome: "Despesas Financeiras", subgrupos: [
        { codigo: 34100, nome: "Financiamentos", itens: [
          { codigo: 34101, nome: "Pedras pequenas", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
        ] },
        { codigo: 34200, nome: "Despesas bancárias", itens: [
          { codigo: 34201, nome: "Tarifas bancárias Sicredi", periodicidade: "M", valorOrcado: 200, valorOrcadoMensal: 200, classificacao: "E" },
          { codigo: 34202, nome: "Tarifas de câmbio", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 34203, nome: "Seguro empresarial", periodicidade: "M", valorOrcado: 865.71, valorOrcadoMensal: 865.71, classificacao: "E" },
          { codigo: 34204, nome: "Consorcio", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 34205, nome: "Tarifas Bancarias Banrisul", periodicidade: "M", valorOrcado: 75, valorOrcadoMensal: 75, classificacao: "E" },
        ] },
      ] },
      { codigo: 35000, nome: "Marketing e Publicidade", subgrupos: [
        { codigo: 35100, nome: "Marketing Social Institucional", itens: [
          { codigo: 35101, nome: "Ativales", periodicidade: "M", valorOrcado: 164.61, valorOrcadoMensal: 164.61, classificacao: "E" },
          { codigo: 35102, nome: "ACI", periodicidade: "M", valorOrcado: 83.50, valorOrcadoMensal: 83.50, classificacao: "E" },
          { codigo: 35103, nome: "Patrocínios institucionais na cidade", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "S" },
          { codigo: 35104, nome: "Patrocínio Gauten Summit", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "S" },
          { codigo: 35105, nome: "Semana Acad. Unisc", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "S" },
          { codigo: 35106, nome: "Semana Acad. Dom Alberto", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "S" },
          { codigo: 35107, nome: "Outros eventos IE técnicos", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "S" },
          { codigo: 35108, nome: "Patrocinio Semana do Lixo Zero", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "S" },
        ] },
        { codigo: 35200, nome: "Marketing Comercial", itens: [
          { codigo: 35201, nome: "Viagens no RS (combustivel & Cia)", periodicidade: "M", valorOrcado: 1000, valorOrcadoMensal: 1000, classificacao: "E" },
          { codigo: 35202, nome: "Viagens fora RS (voos, hoteis & Cia)", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 35203, nome: "Comercial", periodicidade: "M", valorOrcado: 10000, valorOrcadoMensal: 10000, classificacao: "E" },
          { codigo: 35204, nome: "Comissionamento de vendas Comercial", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 35205, nome: "Eventos institucionais", periodicidade: "A", valorOrcado: 50000, valorOrcadoMensal: 4166.67, classificacao: "E" },
          { codigo: 35206, nome: "AMCHAM", periodicidade: "A", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 35207, nome: "Impulsionamentos", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 35208, nome: "ACATE", periodicidade: "M", valorOrcado: 99.48, valorOrcadoMensal: 99.48, classificacao: "E" },
          { codigo: 35209, nome: "Marciely MKT", periodicidade: "M", valorOrcado: 1597, valorOrcadoMensal: 1597, classificacao: "E" },
          { codigo: 35210, nome: "Ferramentas (RD Station)", periodicidade: "M", valorOrcado: 1560, valorOrcadoMensal: 1560, classificacao: "E" },
          { codigo: 35211, nome: "Telefone Celular", periodicidade: "M", valorOrcado: 102.92, valorOrcadoMensal: 102.92, classificacao: "E" },
          { codigo: 35212, nome: "Comissionamento de vendas 1 trimestre", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
          { codigo: 35213, nome: "Comissionamento de vendas 2 trimestre", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
          { codigo: 35214, nome: "Comissionamento de vendas 3 trimestre", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
          { codigo: 35215, nome: "Comissionamento de vendas 4 trimestre", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
          { codigo: 35216, nome: "Apollo", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
        ] },
      ] },
      { codigo: 36000, nome: "Espaço Gauten", subgrupos: [
        { codigo: 36100, nome: "Gauten Instalações", itens: [
          { codigo: 36101, nome: "Internet", periodicidade: "M", valorOrcado: 120, valorOrcadoMensal: 120, classificacao: "E" },
          { codigo: 36102, nome: "Mercado", periodicidade: "M", valorOrcado: 100, valorOrcadoMensal: 100, classificacao: "E" },
          { codigo: 36103, nome: "Limpeza", periodicidade: "M", valorOrcado: 130, valorOrcadoMensal: 130, classificacao: "E" },
          { codigo: 36104, nome: "Filial", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: null },
          { codigo: 36105, nome: "Aluguel", periodicidade: "M", valorOrcado: 975.68, valorOrcadoMensal: 975.68, classificacao: "E" },
        ] },
      ] },
      { codigo: 37000, nome: "Manutenção", subgrupos: [
        { codigo: 37100, nome: "Computadores", itens: [
          { codigo: 37101, nome: "Novos notebooks", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
          { codigo: 37102, nome: "Manutenção equipamentos", periodicidade: "M", valorOrcado: 0, valorOrcadoMensal: 0, classificacao: "E" },
        ] },
        { codigo: 37200, nome: "Espaço Gauten", itens: [] },
      ] },
    ],
  },
  {
    codigoRaiz: 40000, tipo: "E", grupos: [
      { codigo: 41000, nome: "Distribuição de lucros", itens: [
        { codigo: 41100, nome: "Guilherme Rohr", periodicidade: "M", valorOrcado: 14574.73, valorOrcadoMensal: 14574.73, classificacao: "E" },
        { codigo: 41200, nome: "Feliciano de Vargas", periodicidade: "M", valorOrcado: 3337.11, valorOrcadoMensal: 3337.11, classificacao: "E" },
        { codigo: 41300, nome: "Larissa Bittencourt", periodicidade: "M", valorOrcado: 4846.48, valorOrcadoMensal: 4846.48, classificacao: "E" },
      ] },
    ],
  },
]

async function main() {
  const exercicios = await prisma.$queryRaw<{ id: bigint; ano: number; status: string }[]>`
    SELECT id, ano, status FROM exercicio WHERE status = 'rascunho'`
  if (exercicios.length !== 1) {
    throw new Error(
      `Esperava exatamente 1 exercício em rascunho, encontrei ${exercicios.length}. ` +
      `Abortando — confira manualmente antes de rodar de novo.`,
    )
  }
  const exercicioId = exercicios[0].id
  console.log(`Exercício em rascunho: ano ${exercicios[0].ano} (id=${exercicioId})`)

  const raizes = await prisma.$queryRaw<{ id: bigint; codigo: string }[]>`
    SELECT id, codigo::text AS codigo FROM conta_grupo
    WHERE exercicio_id = ${exercicioId} AND grupo_pai_id IS NULL`
  const raizPorCodigo = new Map(raizes.map((r) => [Number(r.codigo), r.id]))
  for (const bloco of BLOCOS) {
    if (!raizPorCodigo.has(bloco.codigoRaiz)) {
      throw new Error(`Bloco-raiz ${bloco.codigoRaiz} não encontrado no exercício ${exercicios[0].ano}. Abortando.`)
    }
  }

  const tipos = await prisma.$queryRaw<{ id: number; sigla: string }[]>`SELECT id, sigla FROM tipo_conta`
  const tipoPorSigla = new Map(tipos.map((t) => [t.sigla, t.id]))

  await prisma.$transaction(async (tx) => {
    // 1) Limpa itens de orçamento sem histórico de execução (nunca toca lancamento_realizado).
    const itensRemovidos = await tx.$executeRaw`
      DELETE FROM conta_item ci
      USING conta_grupo cg
      WHERE ci.grupo_id = cg.id
        AND cg.exercicio_id = ${exercicioId}
        AND cg.grupo_pai_id IS NOT NULL
        AND ci.origem = 'orcamento'
        AND ci.id NOT IN (SELECT conta_item_id FROM lancamento_realizado)`
    console.log(`Itens de orçamento removidos (sem histórico de execução): ${itensRemovidos}`)

    // 2) Remove grupos/subgrupos não-raiz que ficaram sem filhos (nem item, nem subgrupo).
    //    Repete algumas vezes para deixar cascata de 2 níveis (subgrupo vazio -> grupo some depois).
    for (let i = 0; i < 5; i++) {
      const removidos = await tx.$executeRaw`
        DELETE FROM conta_grupo cg
        WHERE cg.exercicio_id = ${exercicioId}
          AND cg.grupo_pai_id IS NOT NULL
          AND cg.origem = 'orcamento'
          AND NOT EXISTS (SELECT 1 FROM conta_item ci WHERE ci.grupo_id = cg.id)
          AND NOT EXISTS (SELECT 1 FROM conta_grupo filho WHERE filho.grupo_pai_id = cg.id)`
      if (removidos === 0 && i > 0) break
      if (removidos > 0) console.log(`Grupos vazios removidos (passo ${i + 1}): ${removidos}`)
    }

    // 3) Upsert de grupos/subgrupos por (exercicio_id, codigo); guarda o id resolvido.
    const idPorCodigo = new Map<number, bigint>()
    async function upsertGrupo(codigo: number, nome: string, paiId: bigint, tipoContaId: number) {
      const existente = await tx.$queryRaw<{ id: bigint }[]>`
        SELECT id FROM conta_grupo WHERE exercicio_id = ${exercicioId} AND codigo = ${codigo}`
      if (existente[0]) {
        await tx.$executeRaw`
          UPDATE conta_grupo SET nome = ${nome}, grupo_pai_id = ${paiId}, tipo_conta_id = ${tipoContaId}, updated_at = now()
          WHERE id = ${existente[0].id}`
        idPorCodigo.set(codigo, existente[0].id)
        return existente[0].id
      }
      const criado = await tx.$queryRaw<{ id: bigint }[]>`
        INSERT INTO conta_grupo (exercicio_id, codigo, grupo_pai_id, tipo_conta_id, nome, origem)
        VALUES (${exercicioId}, ${codigo}, ${paiId}, ${tipoContaId}, ${nome}, 'orcamento')
        RETURNING id`
      idPorCodigo.set(codigo, criado[0].id)
      return criado[0].id
    }

    let gruposCriadosOuAtualizados = 0
    let itensCriados = 0

    for (const bloco of BLOCOS) {
      const tipoContaId = tipoPorSigla.get(bloco.tipo)
      if (!tipoContaId) throw new Error(`tipo_conta '${bloco.tipo}' não encontrado`)
      const raizId = raizPorCodigo.get(bloco.codigoRaiz)!

      for (const grupo of bloco.grupos) {
        const grupoId = await upsertGrupo(grupo.codigo, grupo.nome, raizId, tipoContaId)
        gruposCriadosOuAtualizados++

        for (const item of grupo.itens ?? []) {
          await tx.$executeRaw`
            INSERT INTO conta_item (grupo_id, nome, periodicidade, valor_orcado, valor_orcado_mensal, classificacao, origem)
            VALUES (${grupoId}, ${item.nome}, ${item.periodicidade}, ${item.valorOrcado}::numeric, ${item.valorOrcadoMensal}::numeric, ${item.classificacao}, 'orcamento')`
          itensCriados++
        }

        for (const subgrupo of grupo.subgrupos ?? []) {
          const subgrupoId = await upsertGrupo(subgrupo.codigo, subgrupo.nome, grupoId, tipoContaId)
          gruposCriadosOuAtualizados++

          for (const item of subgrupo.itens ?? []) {
            await tx.$executeRaw`
              INSERT INTO conta_item (grupo_id, nome, periodicidade, valor_orcado, valor_orcado_mensal, classificacao, origem)
              VALUES (${subgrupoId}, ${item.nome}, ${item.periodicidade}, ${item.valorOrcado}::numeric, ${item.valorOrcadoMensal}::numeric, ${item.classificacao}, 'orcamento')`
            itensCriados++
          }
        }
      }
    }

    console.log(`Grupos/subgrupos criados ou atualizados: ${gruposCriadosOuAtualizados}`)
    console.log(`Itens inseridos: ${itensCriados}`)
  }, { timeout: 60_000 })

  // Aviso final: itens antigos preservados por terem histórico de execução (não apagados).
  const preservados = await prisma.$queryRaw<{ nome: string; grupo_codigo: string }[]>`
    SELECT DISTINCT ci.nome, cg.codigo::text AS grupo_codigo
    FROM conta_item ci
    JOIN conta_grupo cg ON cg.id = ci.grupo_id
    WHERE ci.id IN (SELECT conta_item_id FROM lancamento_realizado)
      AND cg.exercicio_id = ${exercicioId}`
  if (preservados.length > 0) {
    console.log("\nATENÇÃO — itens antigos preservados (têm lançamento realizado, não foram apagados):")
    for (const p of preservados) console.log(`  - "${p.nome}" no grupo ${p.grupo_codigo}`)
  }

  console.log("\nCarga concluída.")
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(async () => { await prisma.$disconnect() })

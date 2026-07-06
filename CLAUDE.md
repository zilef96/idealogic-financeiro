# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> Idioma do projeto: código, comentários, commits e UI em **pt-BR**.

## O que é este projeto

Plataforma web interna de **gestão financeira da Idealogic** (orçamento 2026). O
repositório está hoje no scaffold inicial do Next.js — a construção real segue a
especificação e os planos em `docs/migracao-novo-projeto/`. **Antes de implementar
qualquer feature, leia a especificação correspondente.**

MVP = telas de **Orçamentação** (planejar o orçamento anual, com publicação que
congela a referência), **Execução Orçamentária** (lançar realizado mês a mês,
orçado mensal editável, desvio, projeção de caixa, check-in de pendências),
**Dashboard executiva** (indicadores e gráficos sobre os dados de execução) e
**Parâmetros do exercício** (variáveis editáveis por ano). Precificação, cadastro
de clientes/colaboradores e sincronização com Conta Azul seguem **fora do escopo**
(fase 2).

## Documentação de referência (fonte da verdade)

Leia na ordem ao começar uma frente de trabalho:

1. `docs/migracao-novo-projeto/especificacao/00-visao-geral.md` — contexto, escopo, glossário de negócio.
2. `.../especificacao/01-prd.md` — requisitos, regras de negócio (RN-OR-*, RN-EX-*), CRUD, indicadores.
3. `.../especificacao/02-arquitetura.md` — stack, camadas, convenções, ADRs.
4. `.../especificacao/03-modelo-dados.md` — DDL completo (9 tabelas + 2 views + trigger).
5. `.../especificacao/04-seed.sql` — carga inicial real de 2026.
6. `.../planos/plano-{1..4}-*.md` — execução passo a passo, **nesta ordem** (há dependências): 1 fundação → 2 autenticação → 3 orçamentação → 4 execução.

## Comandos

```bash
npm run dev      # servidor de desenvolvimento (localhost:3000)
npm run build    # build de produção (valida TypeScript)
npm run lint     # ESLint (eslint-config-next, flat config)
npm run start    # serve o build

# A serem adicionados ao seguir os planos (ainda não existem no package.json):
npm test                              # vitest run (após Plano 1, Task 8)
npx vitest run caminho/arquivo.test.ts  # rodar um único arquivo de teste
npx prisma migrate deploy             # aplica migrations
npx prisma db pull && npx prisma generate  # introspecta o banco → gera o client
node scripts/seed.mjs                  # carrega o seed (espera DATABASE_URL)
```

Variáveis de ambiente mínimas (`.env`): `DATABASE_URL` (PostgreSQL) e `AUTH_SECRET`
(≥ 32 chars, segredo do JWT).

## Banco no Supabase (gerenciado)

Postgres roda no **Supabase**. `.env` tem **duas conexões**: `DATABASE_URL` (pooled 6543,
`?pgbouncer=true&connection_limit=1`, app) e `DIRECT_URL` (direta 5432, `migrate`/`db pull`).

**Ao mergear alterações de `prisma/migrations/**`, propague ao Supabase** com
`npx prisma migrate deploy` — senão o banco fica dessincronizado do código (views inclusas,
pois vivem no SQL das migrations).

## Arquitetura alvo

**Monólito Next.js 16 (App Router) + React 19 + TypeScript + PostgreSQL.** Backend
em camadas dentro do próprio Next. Toda requisição mutável atravessa as três
camadas — nunca pule etapas:

```
Route Handler (controller)  →  Service (regra pura)  →  Repository  →  PostgreSQL
  auth/RBAC, Zod, status HTTP   cálculos, sem I/O      Prisma (escrita) + views (leitura)
```

- **Controller** (`src/app/api/*/route.ts`): autentica/autoriza (RBAC), valida com **Zod**, chama o service, mapeia status HTTP. Fino, sem regra de negócio.
- **Service** (`src/lib/services/*`): regra de negócio **pura e testável**, sem acesso a banco. É onde mora a maior cobertura de testes (distribuição mensal, cópia de período, desvio, indicadores, superávit, margem, custo hora, projeção de caixa, tributos).
- **Repository** (`src/lib/repositories/*`): **único** ponto de acesso a dados. **Escrita nas tabelas via Prisma; leitura nas views via `$queryRaw`** (mapeando `snake_case`/`Decimal` → `camelCase`/`number`). UI e controllers nunca usam Prisma direto.

Convenções de status HTTP: `400` JSON malformado · `422` falha de schema Zod ·
`401` não autenticado · `403` sem perfil · `409` competência fechada (FC001) ·
`201` criação.

## Conceitos de domínio que afetam o código

- **Hierarquia de contas**: bloco (R/C/D/E) → grupo → subgrupo → item. `conta_grupo` é auto-relacionada (`grupo_pai_id`); item é a folha orçada. Totais de grupo são **sempre** a soma dos filhos (rollup feito na view `vw_execucao_mensal` via CTE recursiva).
- **Item anual ÷ 12**: item com periodicidade `A` distribui `valor/12` em cada um dos 12 meses. Não existe "mês de pagamento".
- **Orçado projetado × orçado mensal**: o projetado é a referência **travada** na Orçamentação **publicada/congelada**; o **orçado mensal** é ajustável por competência e é a base de desvio e indicadores. A Execução exibe 3 colunas (orçado mensal · realizado · desvio), sem a coluna de projetado.
- **Leitura sempre via views** (`vw_orcamentacao`, `vw_execucao_mensal`): são o modelo de leitura estável. Ao mudar a leitura, **edite o SQL da migration da view**, não só o `schema.prisma`.
- **Trava de fechamento (FC001)**: um trigger PostgreSQL bloqueia escrita em `lancamento_realizado` de competência `concluido`, lançando `ERRCODE FC001`. O `handleApiError` mapeia FC001 → HTTP 409. A integridade vive no banco, não na UI.
- **Perfis**: `admin` (acesso total ao MVP, único que edita) e `socio`
  (**visualizador** — acessa a Dashboard; demais telas podem ser liberadas em
  leitura no futuro). Rotas mutáveis exigem `admin`. Guarda em três pontos: menu
  (por perfil), página (Server Component) e controller.
- **Valores monetários**: `Decimal` no banco; usar biblioteca de decimal nos cálculos sensíveis dos services, convertendo para `number` só na borda de apresentação.
- **Ajustes da reunião 17/06/2026** (ver `docs/anotacoes-escopo/analise-ajustes-reuniao-2026-06-17.md`):
  Execução sem a coluna de orçado projetado (3 colunas: orçado mensal · realizado ·
  desvio); orçado mensal editável; novos itens entram pela Execução (com vigência);
  tributos lançados manualmente; caixa do 1º mês = caixa inicial e aplicação tratada
  fora do caixa; fechar/reabrir mês com log de auditoria.

## Testes

Vitest com `fileParallelism: false`. Foco em **services** (regras puras). Testes de
controller mockam o guard de perfil. Testes de repository exigem um PostgreSQL de
desenvolvimento acessível. Os planos seguem **TDD** (teste que falha → implementa →
passa → commit) com tarefas bite-sized.

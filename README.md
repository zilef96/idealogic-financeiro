# Gestão Financeira — Idealogic

Plataforma web interna para planejar e acompanhar o orçamento anual da Idealogic.

Telas do MVP:

- **Orçamentação** — planeja o orçamento do exercício; a publicação congela a referência.
- **Execução Orçamentária** — lança o realizado mês a mês, com orçado mensal editável,
  desvio e fechamento de competência.
- **Dashboard** — indicadores e gráficos sobre os dados de execução.
- **Relatório** — relatório de informação mensal, com saldos bancários.
- **Parâmetros** — variáveis do exercício, editáveis por ano.

Fora de escopo (fase 2): precificação, cadastro de clientes/colaboradores e
sincronização com Conta Azul.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 6 ·
PostgreSQL no Supabase (banco + Auth) · Vitest.

Requer **Node 22 ou superior** — o client do Supabase precisa do `WebSocket`
global, que não existe no Node 20.

## Setup

Peça a quem já está no projeto as credenciais do Supabase — o banco normalmente já
existe. Para criar um do zero, veja [Provisionar um banco novo](#provisionar-um-banco-novo).

```bash
npm ci

cp .env.example .env   # preencha com as credenciais recebidas

npx prisma generate    # gera o Prisma Client a partir do schema

npm run dev            # http://localhost:3000
```

## Provisionar um banco novo

**Só é necessário ao criar um projeto Supabase do zero.** Com um banco já provisionado,
pule esta seção.

```bash
npx prisma migrate deploy   # 9 tabelas, 2 views e o trigger de fechamento

# seed fictício: poucos itens por bloco, valores arbitrários, nenhum dado real
npx prisma db execute --url "$DIRECT_URL" --file prisma/seed.sql
```

Use a `DIRECT_URL` (porta 5432) para migrations e seed — a `DATABASE_URL` passa pelo
pooler em modo transaction. Se preferir, `psql "$DIRECT_URL" -f prisma/seed.sql` faz o
mesmo.

Falta criar o primeiro administrador. O seed grava as linhas de `usuario`, mas **não
cria credencial**: a senha vive no Supabase Auth e o `auth_user_id` fica `NULL`.

1. No painel do Supabase, em **Authentication → Users → Add user**, crie o usuário com
   e-mail e senha, marque o e-mail como confirmado e copie o UUID gerado.
2. Case o UUID com a linha correspondente:

   ```sql
   UPDATE usuario SET auth_user_id = '<uuid-copiado>' WHERE email = 'admin@example.com';
   ```

O passo 2 é obrigatório porque a sessão só é aceita quando existe um `usuario` com
`auth_user_id` casado (`src/lib/auth-server.ts`). Feito isso, você entra em `/login`
com esse e-mail e senha — e os demais usuários já saem por **Admin → Usuários** dentro
da aplicação, que gera o link de convite.

## Comandos

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção (valida TypeScript)
npm run lint     # ESLint
npm test         # Vitest (suíte completa)
npm run start    # serve o build

npx vitest run src/lib/__tests__/execucao-service.test.ts   # um arquivo só
npx prisma migrate deploy   # aplica migrations pendentes
npx prisma db pull && npx prisma generate   # introspecta o banco e regenera o client
```

## Arquitetura

Monólito Next.js com backend em camadas. **Toda requisição mutável atravessa as três
camadas — não pule etapas:**

```
Route Handler (controller)  →  Service (regra pura)  →  Repository  →  PostgreSQL
  auth/RBAC, Zod, status HTTP   cálculos, sem I/O      Prisma (escrita) + views (leitura)
```

- **Controller** (`src/app/api/*/route.ts`) — autentica, autoriza, valida com Zod,
  chama o service e mapeia o status HTTP. Fino, sem regra de negócio.
- **Service** (`src/lib/services/*`) — regra de negócio pura e testável, sem acesso a
  banco. É onde mora a maior parte dos testes.
- **Repository** (`src/lib/repositories/*`) — único ponto de acesso a dados. Escrita
  nas tabelas via Prisma; leitura nas views via `$queryRaw`. Componentes e controllers
  nunca usam Prisma direto.

Status HTTP por convenção: `400` JSON malformado · `422` falha de schema Zod ·
`401` não autenticado · `403` sem perfil · `409` competência fechada · `201` criação.

Perfis: **admin** (único que edita) e **socio** (visualizador). O papel vem sempre da
tabela `usuario`, nunca de claim do token. A guarda existe em três pontos: menu,
página (Server Component) e controller.

### Detalhes de domínio que costumam pegar quem chega

- **Hierarquia de contas**: bloco (R/C/D/E) → grupo → subgrupo → item. `conta_grupo` é
  auto-relacionada; o item é a folha orçada. Total de grupo é sempre a soma dos filhos
  (rollup feito na view, por CTE recursiva).
- **Item anual ÷ 12**: item com periodicidade `A` distribui `valor/12` em cada mês.
  Não existe "mês de pagamento".
- **Orçado projetado × orçado mensal**: o projetado é a referência travada na
  Orçamentação publicada; o orçado mensal é ajustável por competência e é a base de
  desvio e indicadores. A Execução mostra 3 colunas: orçado mensal, realizado, desvio.
- **Leitura via views** (`vw_orcamentacao`, `vw_execucao_mensal`): são o modelo de
  leitura estável. Para mudar a leitura, edite o SQL da migration da view — não só o
  `schema.prisma`.
- **Trava de fechamento**: um trigger no Postgres bloqueia escrita em
  `lancamento_realizado` de competência concluída, com `ERRCODE FC001`, que o
  `handleApiError` mapeia para HTTP 409. A integridade vive no banco, não na UI.
- **Valores monetários**: `Decimal` no banco; converta para `number` só na borda de
  apresentação.

## Banco

O Postgres roda no Supabase e o `.env` tem **duas conexões**: `DATABASE_URL` (pooled,
6543, usada pela aplicação) e `DIRECT_URL` (direta, 5432, usada por `migrate` e
`db pull`).

Ao mergear qualquer alteração em `prisma/migrations/**`, propague com
`npx prisma migrate deploy` — senão o banco fica dessincronizado do código. Isso inclui
as views, que vivem no SQL das migrations.

## Testes

Vitest com `fileParallelism: false`. O foco é nos services, que são regra pura. Testes
de controller mockam o guard de perfil.

```bash
npm test
```

## Fluxo de trabalho

`dev` é a branch de integração; `main` é o que vai para produção. Crie a feature branch
a partir de `dev` e faça merge com `--no-ff`.

Código, comentários, commits e UI em **pt-BR**.

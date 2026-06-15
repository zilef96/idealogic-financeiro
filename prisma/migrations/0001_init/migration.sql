-- Migration inicial — schema do MVP (9 tabelas + 2 views + trigger FC001)
-- Fonte: docs/migracao-novo-projeto/especificacao/03-modelo-dados.md (§4–§5)

-- =====================================================================
-- §4.1 Pré-requisitos
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- §4.2 Domínio e período
-- =====================================================================
CREATE TABLE exercicio (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ano        smallint    NOT NULL UNIQUE,
  descricao  varchar(60),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exercicio_ano_chk CHECK (ano BETWEEN 2000 AND 2100)
);

CREATE TABLE tipo_conta (
  id    smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sigla char(1)     NOT NULL UNIQUE,
  nome  varchar(40) NOT NULL,
  CONSTRAINT tipo_conta_sigla_chk CHECK (sigla IN ('R','C','D','E'))
);

-- =====================================================================
-- §4.3 Plano de contas
-- =====================================================================
CREATE TABLE conta_grupo (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  exercicio_id  bigint       NOT NULL REFERENCES exercicio (id),
  codigo        numeric(8,0) NOT NULL,
  grupo_pai_id  bigint       REFERENCES conta_grupo (id),    -- NULL = bloco/raiz
  tipo_conta_id smallint     NOT NULL REFERENCES tipo_conta (id),
  nome          varchar(150) NOT NULL,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT conta_grupo_codigo_uq   UNIQUE (exercicio_id, codigo),
  CONSTRAINT conta_grupo_nao_autopai CHECK (grupo_pai_id IS NULL OR grupo_pai_id <> id)
);

CREATE TABLE conta_item (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  grupo_id            bigint        NOT NULL REFERENCES conta_grupo (id),
  codigo              numeric(8,0)  NOT NULL,
  nome                varchar(150)  NOT NULL,
  periodicidade       char(1)       NOT NULL,
  valor_orcado        numeric(18,2) NOT NULL,              -- total anual
  valor_orcado_mensal numeric(18,2) NOT NULL,              -- por mês (A -> /12)
  classificacao       char(1),                             -- E/S (despesa) ou C/P (receita)
  is_fixo             boolean       NOT NULL DEFAULT false, -- derivado: Essencial/Contratado
  comentarios         text,
  mes_inicio          smallint,                            -- 'M': início da vigência
  mes_fim             smallint,                            -- 'M': fim da vigência
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT conta_item_codigo_uq         UNIQUE (grupo_id, codigo),
  CONSTRAINT conta_item_periodicidade_chk CHECK (periodicidade IN ('M','A')),
  CONSTRAINT conta_item_classificacao_chk CHECK (classificacao IS NULL OR classificacao IN ('E','S','C','P')),
  CONSTRAINT conta_item_mes_inicio_chk    CHECK (mes_inicio IS NULL OR mes_inicio BETWEEN 1 AND 12),
  CONSTRAINT conta_item_mes_fim_chk       CHECK (mes_fim    IS NULL OR mes_fim    BETWEEN 1 AND 12),
  CONSTRAINT conta_item_mes_ordem_chk     CHECK (mes_fim IS NULL OR mes_inicio IS NULL OR mes_fim >= mes_inicio)
);

-- =====================================================================
-- §4.4 Execução orçamentária
-- =====================================================================
CREATE TABLE lancamento_realizado (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conta_item_id   bigint        NOT NULL REFERENCES conta_item (id),
  exercicio_id    bigint        NOT NULL REFERENCES exercicio (id),
  competencia     date          NOT NULL,                 -- 1º dia do mês
  data_lancamento date,
  valor_realizado numeric(18,2),                          -- anulável; pode ser negativo (estorno)
  valor_orcado    numeric(18,2),                          -- orçado mensal ajustável
  descricao       varchar(200),
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT lanc_comp_dia_chk                 CHECK (date_trunc('month', competencia) = competencia),
  CONSTRAINT lancamento_realizado_item_comp_uq UNIQUE (conta_item_id, competencia)
);

-- =====================================================================
-- §4.5 Parâmetros e tesouraria
-- =====================================================================
CREATE TABLE parametro_mensal (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  exercicio_id bigint        NOT NULL REFERENCES exercicio (id),
  competencia  date          NOT NULL,
  chave        varchar(40)   NOT NULL,
  valor        numeric(18,4) NOT NULL,
  CONSTRAINT parametro_mensal_uq    UNIQUE (exercicio_id, competencia, chave),
  CONSTRAINT parametro_comp_dia_chk CHECK (date_trunc('month', competencia) = competencia)
);

CREATE TABLE evento_tesouraria (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  exercicio_id bigint        NOT NULL REFERENCES exercicio (id),
  competencia  date          NOT NULL,
  tipo         varchar(20)   NOT NULL,
  valor        numeric(18,2) NOT NULL,
  descricao    varchar(150),
  CONSTRAINT evento_tipo_chk     CHECK (tipo IN ('aplicacao','resgate')),
  CONSTRAINT evento_valor_chk    CHECK (valor >= 0),
  CONSTRAINT evento_comp_dia_chk CHECK (date_trunc('month', competencia) = competencia)
);

-- =====================================================================
-- §4.6 Fechamento mensal + trava (FC001)
-- =====================================================================
CREATE TABLE fechamento_mensal (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  exercicio_id  bigint      NOT NULL REFERENCES exercicio (id),
  competencia   date        NOT NULL,
  status        varchar(12) NOT NULL DEFAULT 'aberto',
  concluido_por varchar(120),
  concluido_em  timestamptz,
  observacao    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fechamento_status_chk CHECK (status IN ('aberto','concluido')),
  CONSTRAINT fechamento_mensal_uq  UNIQUE (exercicio_id, competencia)
);

CREATE OR REPLACE FUNCTION trg_bloqueia_lancamento_fechado()
RETURNS trigger AS $$
DECLARE
  v_competencia date;
  v_exercicio   bigint;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_competencia := OLD.competencia; v_exercicio := OLD.exercicio_id;
  ELSE
    v_competencia := NEW.competencia; v_exercicio := NEW.exercicio_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM fechamento_mensal fm
    WHERE fm.exercicio_id = v_exercicio
      AND date_trunc('month', fm.competencia) = date_trunc('month', v_competencia)
      AND fm.status = 'concluido'
  ) THEN
    RAISE EXCEPTION 'Competência % está fechada (exercício %); escrita bloqueada.',
      v_competencia, v_exercicio USING ERRCODE = 'FC001';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bloqueia_lancamento_fechado
  BEFORE INSERT OR UPDATE OR DELETE ON lancamento_realizado
  FOR EACH ROW EXECUTE FUNCTION trg_bloqueia_lancamento_fechado();

-- =====================================================================
-- §4.7 Autenticação
-- =====================================================================
CREATE TABLE usuario (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome       varchar(120)   NOT NULL,
  email      varchar(120)   NOT NULL,
  perfil     varchar(10)    NOT NULL,
  senha_hash varchar(60)    NOT NULL,                      -- bcrypt
  is_ativo   boolean        NOT NULL DEFAULT true,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT usuario_email_uq  UNIQUE (email),
  CONSTRAINT usuario_perfil_ck CHECK (perfil IN ('socio','admin'))
);
CREATE UNIQUE INDEX ix_usuario_email_lower ON usuario (lower(email));

-- =====================================================================
-- §4.8 Índices
-- =====================================================================
CREATE INDEX ix_conta_grupo_pai      ON conta_grupo (grupo_pai_id);
CREATE INDEX ix_conta_grupo_ex_tipo  ON conta_grupo (exercicio_id, tipo_conta_id);
CREATE INDEX ix_conta_item_grupo     ON conta_item (grupo_id);
CREATE INDEX ix_conta_item_class     ON conta_item (classificacao);
CREATE INDEX ix_lanc_item_comp       ON lancamento_realizado (conta_item_id, competencia);
CREATE INDEX ix_lanc_comp            ON lancamento_realizado (competencia);
CREATE INDEX ix_lanc_exercicio       ON lancamento_realizado (exercicio_id, competencia);
CREATE INDEX ix_evento_tesouraria    ON evento_tesouraria (exercicio_id, competencia);
CREATE INDEX ix_fechamento_status    ON fechamento_mensal (status);

-- =====================================================================
-- §4.9 Triggers de updated_at
-- =====================================================================
CREATE TRIGGER trg_exercicio_upd  BEFORE UPDATE ON exercicio
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_conta_grupo_upd BEFORE UPDATE ON conta_grupo
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_conta_item_upd  BEFORE UPDATE ON conta_item
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lancamento_upd  BEFORE UPDATE ON lancamento_realizado
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_fechamento_upd  BEFORE UPDATE ON fechamento_mensal
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_usuario_upd     BEFORE UPDATE ON usuario
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- §5.1 vw_orcamentacao
-- =====================================================================
CREATE VIEW vw_orcamentacao AS
SELECT
  cg.codigo::text          AS codigo,
  tc.sigla                 AS tipo,
  cg.nome                  AS nome,
  0::numeric(18,2)         AS valor_orcado,
  'M'::text                AS periodicidade,
  0::numeric(18,2)         AS valor_orcado_mensal,
  ''::text                 AS classificacao,
  ''::text                 AS comentarios,
  true                     AS is_grupo,
  ex.ano                   AS ano
FROM conta_grupo cg
JOIN tipo_conta tc ON tc.id = cg.tipo_conta_id
JOIN exercicio ex  ON ex.id = cg.exercicio_id
UNION ALL
SELECT
  ci.codigo::text          AS codigo,
  tc.sigla                 AS tipo,
  ci.nome                  AS nome,
  ci.valor_orcado          AS valor_orcado,
  ci.periodicidade         AS periodicidade,
  ci.valor_orcado_mensal   AS valor_orcado_mensal,
  COALESCE(ci.classificacao, '') AS classificacao,
  COALESCE(ci.comentarios, '')   AS comentarios,
  false                    AS is_grupo,
  ex.ano                   AS ano
FROM conta_item ci
JOIN conta_grupo cg ON cg.id = ci.grupo_id
JOIN tipo_conta tc  ON tc.id = cg.tipo_conta_id
JOIN exercicio ex   ON ex.id = cg.exercicio_id;

-- =====================================================================
-- §5.2 vw_execucao_mensal
-- =====================================================================
CREATE VIEW vw_execucao_mensal AS
WITH RECURSIVE anc(item_id, grupo_id) AS (
  SELECT ci.id, ci.grupo_id FROM conta_item ci
  UNION
  SELECT a.item_id, cg.grupo_pai_id
  FROM anc a JOIN conta_grupo cg ON cg.id = a.grupo_id
  WHERE cg.grupo_pai_id IS NOT NULL
),
item_orc AS (
  SELECT ci.id AS item_id, g.mes,
    COALESCE(
      lr.valor_orcado,                       -- orçado mensal ajustado, se houver
      CASE
        WHEN g.mes BETWEEN COALESCE(ci.mes_inicio,1) AND COALESCE(ci.mes_fim,12)
        THEN ci.valor_orcado_mensal
        ELSE 0
      END
    ) AS orcado
  FROM conta_item ci
  CROSS JOIN generate_series(1,12) AS g(mes)
  LEFT JOIN lancamento_realizado lr
    ON lr.conta_item_id = ci.id AND EXTRACT(MONTH FROM lr.competencia)::int = g.mes
),
item_orc_anual AS (
  SELECT item_id, sum(orcado) AS orcado_anual FROM item_orc GROUP BY item_id
),
grupo_orc AS (
  SELECT a.grupo_id, io.mes, sum(io.orcado) AS orcado
  FROM anc a JOIN item_orc io ON io.item_id = a.item_id
  GROUP BY a.grupo_id, io.mes
),
grupo_orc_anual AS (
  SELECT grupo_id, sum(orcado) AS orcado_anual FROM grupo_orc GROUP BY grupo_id
),
grupo_real AS (
  SELECT a.grupo_id, EXTRACT(MONTH FROM lr.competencia)::int AS mes,
         sum(lr.valor_realizado) AS realizado
  FROM anc a JOIN lancamento_realizado lr ON lr.conta_item_id = a.item_id
  GROUP BY a.grupo_id, EXTRACT(MONTH FROM lr.competencia)
)
-- Grupos (rollup)
SELECT
  COALESCE(pai.codigo::text, '') AS codigo_pai,
  cg.codigo::text               AS codigo,
  cg.nome                       AS nome,
  'M'::text                     AS periodicidade,
  goa.orcado_anual              AS valor_orcado_ref,
  g.mes                         AS mes,
  COALESCE(go.orcado, 0)        AS orcado,
  gr.realizado                  AS realizado,
  ex.ano                        AS ano
FROM conta_grupo cg
JOIN exercicio ex ON ex.id = cg.exercicio_id
JOIN grupo_orc_anual goa ON goa.grupo_id = cg.id
CROSS JOIN generate_series(1,12) AS g(mes)
LEFT JOIN grupo_orc  go ON go.grupo_id = cg.id AND go.mes = g.mes
LEFT JOIN grupo_real gr ON gr.grupo_id = cg.id AND gr.mes = g.mes
LEFT JOIN conta_grupo pai ON pai.id = cg.grupo_pai_id
UNION ALL
-- Itens (folhas)
SELECT
  cg.codigo::text        AS codigo_pai,
  ci.codigo::text        AS codigo,
  ci.nome                AS nome,
  ci.periodicidade::text AS periodicidade,
  ioa.orcado_anual       AS valor_orcado_ref,
  io.mes                 AS mes,
  io.orcado              AS orcado,
  (SELECT sum(lr.valor_realizado) FROM lancamento_realizado lr
     WHERE lr.conta_item_id = ci.id AND EXTRACT(MONTH FROM lr.competencia)::int = io.mes) AS realizado,
  ex.ano                 AS ano
FROM conta_item ci
JOIN conta_grupo cg ON cg.id = ci.grupo_id
JOIN exercicio ex ON ex.id = cg.exercicio_id
JOIN item_orc io ON io.item_id = ci.id
JOIN item_orc_anual ioa ON ioa.item_id = ci.id;

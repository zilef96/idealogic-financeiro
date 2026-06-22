-- origem: separa itens/grupos do plano (orcamento) dos criados na Execução (execucao).
ALTER TABLE conta_item
  ADD COLUMN origem varchar(10) NOT NULL DEFAULT 'orcamento';
ALTER TABLE conta_item
  ADD CONSTRAINT conta_item_origem_chk CHECK (origem IN ('orcamento','execucao'));

ALTER TABLE conta_grupo
  ADD COLUMN origem varchar(10) NOT NULL DEFAULT 'orcamento';
ALTER TABLE conta_grupo
  ADD CONSTRAINT conta_grupo_origem_chk CHECK (origem IN ('orcamento','execucao'));

-- marca de 1ª publicação (guard do evento único de materialização).
ALTER TABLE exercicio
  ADD COLUMN orcamento_materializado_em timestamptz;

-- vw_orcamentacao passa a expor só o que é do plano (origem='orcamento'),
-- em grupos E itens. vw_execucao_mensal NÃO muda (mostra ambos).
CREATE OR REPLACE VIEW vw_orcamentacao AS
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
WHERE cg.origem = 'orcamento'
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
JOIN exercicio ex   ON ex.id = cg.exercicio_id
WHERE ci.origem = 'orcamento';

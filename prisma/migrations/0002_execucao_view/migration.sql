-- Estende vw_execucao_mensal: adiciona orcado_projetado (orçado derivado da
-- vigência, SEM o ajuste de lancamento_realizado.valor_orcado) e is_grupo.
-- As colunas pré-existentes permanecem na mesma ordem (exigência de CREATE OR
-- REPLACE VIEW); as novas são acrescentadas ao final.

CREATE OR REPLACE VIEW vw_execucao_mensal AS
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
      lr.valor_orcado,
      CASE
        WHEN g.mes BETWEEN COALESCE(ci.mes_inicio,1) AND COALESCE(ci.mes_fim,12)
        THEN ci.valor_orcado_mensal
        ELSE 0
      END
    ) AS orcado,
    -- orçado projetado: vigência derivada, sem o ajuste mensal gravado
    CASE
      WHEN g.mes BETWEEN COALESCE(ci.mes_inicio,1) AND COALESCE(ci.mes_fim,12)
      THEN ci.valor_orcado_mensal
      ELSE 0
    END AS orcado_projetado
  FROM conta_item ci
  CROSS JOIN generate_series(1,12) AS g(mes)
  LEFT JOIN lancamento_realizado lr
    ON lr.conta_item_id = ci.id AND EXTRACT(MONTH FROM lr.competencia)::int = g.mes
),
item_orc_anual AS (
  SELECT item_id, sum(orcado) AS orcado_anual FROM item_orc GROUP BY item_id
),
grupo_orc AS (
  SELECT a.grupo_id, io.mes, sum(io.orcado) AS orcado, sum(io.orcado_projetado) AS orcado_projetado
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
  ex.ano                        AS ano,
  COALESCE(go.orcado_projetado, 0) AS orcado_projetado,
  true                          AS is_grupo,
  NULL::bigint                  AS item_id
FROM conta_grupo cg
JOIN exercicio ex ON ex.id = cg.exercicio_id
LEFT JOIN grupo_orc_anual goa ON goa.grupo_id = cg.id   -- LEFT: grupos sem itens aparecem zerados
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
  ex.ano                 AS ano,
  io.orcado_projetado    AS orcado_projetado,
  false                  AS is_grupo,
  ci.id                  AS item_id
FROM conta_item ci
JOIN conta_grupo cg ON cg.id = ci.grupo_id
JOIN exercicio ex ON ex.id = cg.exercicio_id
JOIN item_orc io ON io.item_id = ci.id
JOIN item_orc_anual ioa ON ioa.item_id = ci.id;

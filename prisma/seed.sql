-- =====================================================================
--  SEED FICTÍCIO — apenas para teste inicial em desenvolvimento.
--  NÃO contém dados reais. Poucos itens por bloco, valores arbitrários.
--  Usuários de dev: admin@example.com / socio@example.com (senha: dev123456)
--  Pré-requisito: schema (migrations 0001–0007) já aplicado.
-- =====================================================================
BEGIN;

-- exercicio ---------------------------------------------------
INSERT INTO exercicio (ano, descricao) VALUES
  (2026, 'Orçamento 2026 (dados fictícios)');

-- tipo_conta --------------------------------------------------
INSERT INTO tipo_conta (sigla, nome) VALUES
  ('R', 'Receita'), ('C', 'Custo'), ('D', 'Despesa'), ('E', 'Distribuição');

-- conta_grupo (plano de contas — grupos e subgrupos) ----------
INSERT INTO conta_grupo (exercicio_id,codigo,grupo_pai_id,tipo_conta_id,nome)
SELECT (SELECT id FROM exercicio WHERE ano=2026), 10000, NULL, (SELECT id FROM tipo_conta WHERE sigla='R'), 'Faturamento total';
INSERT INTO conta_grupo (exercicio_id,codigo,grupo_pai_id,tipo_conta_id,nome)
SELECT (SELECT id FROM exercicio WHERE ano=2026), 20000, NULL, (SELECT id FROM tipo_conta WHERE sigla='C'), 'Custos totais';
INSERT INTO conta_grupo (exercicio_id,codigo,grupo_pai_id,tipo_conta_id,nome)
SELECT (SELECT id FROM exercicio WHERE ano=2026), 30000, NULL, (SELECT id FROM tipo_conta WHERE sigla='D'), 'Despesas totais';
INSERT INTO conta_grupo (exercicio_id,codigo,grupo_pai_id,tipo_conta_id,nome)
SELECT (SELECT id FROM exercicio WHERE ano=2026), 40000, NULL, (SELECT id FROM tipo_conta WHERE sigla='E'), 'Dividendos';
INSERT INTO conta_grupo (exercicio_id,codigo,grupo_pai_id,tipo_conta_id,nome)
SELECT (SELECT id FROM exercicio WHERE ano=2026), 10010, (SELECT id FROM conta_grupo WHERE codigo=10000 AND exercicio_id=(SELECT id FROM exercicio WHERE ano=2026)), (SELECT id FROM tipo_conta WHERE sigla='R'), 'Serviços';
INSERT INTO conta_grupo (exercicio_id,codigo,grupo_pai_id,tipo_conta_id,nome)
SELECT (SELECT id FROM exercicio WHERE ano=2026), 20100, (SELECT id FROM conta_grupo WHERE codigo=20000 AND exercicio_id=(SELECT id FROM exercicio WHERE ano=2026)), (SELECT id FROM tipo_conta WHERE sigla='C'), 'Equipe';
INSERT INTO conta_grupo (exercicio_id,codigo,grupo_pai_id,tipo_conta_id,nome)
SELECT (SELECT id FROM exercicio WHERE ano=2026), 30100, (SELECT id FROM conta_grupo WHERE codigo=30000 AND exercicio_id=(SELECT id FROM exercicio WHERE ano=2026)), (SELECT id FROM tipo_conta WHERE sigla='D'), 'Operacional';
INSERT INTO conta_grupo (exercicio_id,codigo,grupo_pai_id,tipo_conta_id,nome)
SELECT (SELECT id FROM exercicio WHERE ano=2026), 41000, (SELECT id FROM conta_grupo WHERE codigo=40000 AND exercicio_id=(SELECT id FROM exercicio WHERE ano=2026)), (SELECT id FROM tipo_conta WHERE sigla='E'), 'Distribuição de lucros';

-- conta_item (itens folha — nomes e valores fictícios) --------
INSERT INTO conta_item (grupo_id,nome,periodicidade,valor_orcado,valor_orcado_mensal,classificacao,is_fixo)
SELECT (SELECT id FROM conta_grupo WHERE codigo=10010 AND exercicio_id=(SELECT id FROM exercicio WHERE ano=2026)), 'Cliente Alfa', 'M', 5000.00, 5000.00, 'C', false;
INSERT INTO conta_item (grupo_id,nome,periodicidade,valor_orcado,valor_orcado_mensal,classificacao,is_fixo)
SELECT (SELECT id FROM conta_grupo WHERE codigo=10010 AND exercicio_id=(SELECT id FROM exercicio WHERE ano=2026)), 'Cliente Beta', 'M', 8000.00, 8000.00, 'P', false;
INSERT INTO conta_item (grupo_id,nome,periodicidade,valor_orcado,valor_orcado_mensal,classificacao,is_fixo)
SELECT (SELECT id FROM conta_grupo WHERE codigo=20100 AND exercicio_id=(SELECT id FROM exercicio WHERE ano=2026)), 'Colaborador Um', 'M', 4000.00, 4000.00, 'E', true;
INSERT INTO conta_item (grupo_id,nome,periodicidade,valor_orcado,valor_orcado_mensal,classificacao,is_fixo)
SELECT (SELECT id FROM conta_grupo WHERE codigo=20100 AND exercicio_id=(SELECT id FROM exercicio WHERE ano=2026)), 'Colaborador Dois', 'M', 4500.00, 4500.00, 'E', true;
INSERT INTO conta_item (grupo_id,nome,periodicidade,valor_orcado,valor_orcado_mensal,classificacao,is_fixo)
SELECT (SELECT id FROM conta_grupo WHERE codigo=30100 AND exercicio_id=(SELECT id FROM exercicio WHERE ano=2026)), 'Aluguel', 'M', 2000.00, 2000.00, 'E', true;
INSERT INTO conta_item (grupo_id,nome,periodicidade,valor_orcado,valor_orcado_mensal,classificacao,is_fixo)
SELECT (SELECT id FROM conta_grupo WHERE codigo=30100 AND exercicio_id=(SELECT id FROM exercicio WHERE ano=2026)), 'Internet', 'M', 300.00, 300.00, 'C', false;
INSERT INTO conta_item (grupo_id,nome,periodicidade,valor_orcado,valor_orcado_mensal,classificacao,is_fixo)
SELECT (SELECT id FROM conta_grupo WHERE codigo=41000 AND exercicio_id=(SELECT id FROM exercicio WHERE ano=2026)), 'Sócio A', 'M', 1000.00, 1000.00, 'E', false;

-- lancamento_realizado (poucos meses, valores fictícios) ------
INSERT INTO lancamento_realizado (conta_item_id, exercicio_id, competencia, valor_realizado, descricao)
SELECT ci.id, e.id, DATE '2026-01-01', 5200.00, 'Realizado jan (fictício)'
FROM conta_item ci JOIN conta_grupo cg ON cg.id=ci.grupo_id CROSS JOIN exercicio e
WHERE e.ano=2026 AND cg.codigo=10010 AND ci.nome='Cliente Alfa';
INSERT INTO lancamento_realizado (conta_item_id, exercicio_id, competencia, valor_realizado, descricao)
SELECT ci.id, e.id, DATE '2026-02-01', 4800.00, 'Realizado fev (fictício)'
FROM conta_item ci JOIN conta_grupo cg ON cg.id=ci.grupo_id CROSS JOIN exercicio e
WHERE e.ano=2026 AND cg.codigo=10010 AND ci.nome='Cliente Alfa';
INSERT INTO lancamento_realizado (conta_item_id, exercicio_id, competencia, valor_realizado, descricao)
SELECT ci.id, e.id, DATE '2026-01-01', 4000.00, 'Realizado jan (fictício)'
FROM conta_item ci JOIN conta_grupo cg ON cg.id=ci.grupo_id CROSS JOIN exercicio e
WHERE e.ano=2026 AND cg.codigo=20100 AND ci.nome='Colaborador Um';

-- parametro_mensal (valores fictícios) ------------------------
INSERT INTO parametro_mensal (exercicio_id, competencia, chave, valor)
SELECT e.id, DATE '2026-01-01', 'saldo_inicial_caixa', 100000.0000 FROM exercicio e WHERE e.ano=2026;
INSERT INTO parametro_mensal (exercicio_id, competencia, chave, valor)
SELECT e.id, DATE '2026-01-01', 'caixa_minimo', 20000.0000 FROM exercicio e WHERE e.ano=2026;
INSERT INTO parametro_mensal (exercicio_id, competencia, chave, valor)
SELECT e.id, DATE '2026-01-01', 'horas_faturaveis', 2000 FROM exercicio e WHERE e.ano=2026;

-- usuario (dev — senha: dev123456) ----------------------------
INSERT INTO usuario (nome, email, perfil, senha_hash) VALUES
  ('Admin Dev', 'admin@example.com', 'admin', '$2b$10$JWwbygqjiZ.G5mAwje4FreIpOGuPNDRqK/whjaqhqNmBDqwQZVl4.'),
  ('Sócio Dev', 'socio@example.com', 'socio', '$2b$10$JWwbygqjiZ.G5mAwje4FreIpOGuPNDRqK/whjaqhqNmBDqwQZVl4.');

COMMIT;

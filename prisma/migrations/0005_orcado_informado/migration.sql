-- Converte valor_orcado de itens mensais (M) da convenção antiga
-- (total anual = mensal × 12) para o valor informado (= mensal), conforme RN-OR-06.
-- Idempotente: usa valor_orcado_mensal como fonte de verdade do mensal e só toca
-- linhas fora da convenção nova. Itens anuais (A) já estão corretos e não são tocados.
UPDATE conta_item
   SET valor_orcado = valor_orcado_mensal,
       updated_at   = now()
 WHERE periodicidade = 'M'
   AND valor_orcado <> valor_orcado_mensal;

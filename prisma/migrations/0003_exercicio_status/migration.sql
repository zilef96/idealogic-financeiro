-- prisma/migrations/0003_exercicio_status/migration.sql
-- Estado de publicação do exercício: 'rascunho' (editável) | 'publicado' (congelado).
ALTER TABLE exercicio
  ADD COLUMN status VARCHAR(12) NOT NULL DEFAULT 'rascunho';

ALTER TABLE exercicio
  ADD CONSTRAINT exercicio_status_chk CHECK (status IN ('rascunho', 'publicado'));

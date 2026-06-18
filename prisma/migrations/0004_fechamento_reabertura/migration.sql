-- prisma/migrations/0004_fechamento_reabertura/migration.sql
-- Auditoria de reabertura de competência (complementa concluido_por/concluido_em).
ALTER TABLE fechamento_mensal ADD COLUMN reaberto_por VARCHAR(120);
ALTER TABLE fechamento_mensal ADD COLUMN reaberto_em  TIMESTAMPTZ;

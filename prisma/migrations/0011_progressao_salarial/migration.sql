-- Tabela de progressão salarial (valor mensal por cargo × maturidade × nível),
-- versionada por ano. Fonte dos valores: planilha "Salários 2026" (abas
-- Progressão Tech e Progressão Backstage). Também alimenta a Precificação.
-- Não referencia exercicio: a tabela de um ano pode existir antes do orçamento.
CREATE TABLE progressao_salarial (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ano          smallint      NOT NULL,
  trilha       varchar(12)   NOT NULL,
  regime       varchar(3)    NOT NULL,
  cargo        varchar(80)   NOT NULL,
  ordem_cargo  smallint      NOT NULL,
  maturidade   varchar(20)   NOT NULL,
  nivel        smallint      NOT NULL,
  ordem_nivel  smallint      NOT NULL,
  valor        numeric(12,2) NOT NULL,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT progressao_salarial_ano_chk    CHECK (ano BETWEEN 2000 AND 2100),
  CONSTRAINT progressao_salarial_trilha_chk CHECK (trilha IN ('tech','backstage')),
  CONSTRAINT progressao_salarial_regime_chk CHECK (regime IN ('PJ','CLT')),
  CONSTRAINT progressao_salarial_valor_chk  CHECK (valor > 0),
  CONSTRAINT progressao_salarial_uq UNIQUE (ano, trilha, regime, cargo, maturidade, nivel)
);

CREATE TRIGGER trg_progressao_upd
  BEFORE UPDATE ON progressao_salarial
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Mesmo padrão da 0010: app acessa via Prisma (dono da tabela), API pública bloqueada.
ALTER TABLE progressao_salarial ENABLE ROW LEVEL SECURITY;

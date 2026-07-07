-- Liga a linha de perfil (usuario) à identidade do Supabase (auth.users.id).
-- Nullable nesta fase: permite criar/linkar por convite ou criação manual (dev).
ALTER TABLE usuario
  ADD COLUMN auth_user_id uuid;

ALTER TABLE usuario
  ADD CONSTRAINT usuario_auth_user_id_uq UNIQUE (auth_user_id);

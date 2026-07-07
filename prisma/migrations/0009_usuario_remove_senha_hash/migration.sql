-- A credencial passa a viver no auth.users do Supabase; usuario guarda só o perfil.
ALTER TABLE usuario
  DROP COLUMN senha_hash;

import { createClient } from "@supabase/supabase-js"

// Client com service_role — SOMENTE server-side (route handlers/server components).
// Não persiste sessão; usado para operações administrativas (convites).
export function criarSupabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente.")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

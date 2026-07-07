import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Client Supabase server-side ligado aos cookies da request (sessão do usuário).
// Usado por getUsuario, login e logout. Nunca usa service_role.
export async function criarSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // chamado de um Server Component (sem escrita de cookie) — o refresh
            // de sessão fica a cargo do proxy (src/proxy.ts). Ignorar aqui.
          }
        },
      },
    },
  )
}

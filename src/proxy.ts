import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Refresh de sessão do Supabase a cada request (padrão @supabase/ssr; no Next 16
// o middleware virou proxy). Reescreve os cookies de auth na resposta; não decide
// autorização — isso é do RBAC (guards de página e controller).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Dispara o refresh do token (getUser valida a sessão e renova se preciso).
  await supabase.auth.getUser()
  return response
}

export const config = {
  // Roda em tudo, menos assets estáticos e imagens do Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

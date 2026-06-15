import { NextResponse, type NextRequest } from "next/server"
import { COOKIE, verificarSessao } from "@/lib/session"

const PUBLICAS = ["/login", "/api/auth", "/api/health"]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLICAS.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get(COOKIE)?.value
  const sessao = token ? await verificarSessao(token) : null
  if (!sessao) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }
    const url = req.nextUrl.clone(); url.pathname = "/login"
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }

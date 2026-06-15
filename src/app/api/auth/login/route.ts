import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { parseBody, handleApiError } from "@/lib/api-helpers"
import { buscarUsuarioPorEmail } from "@/lib/repositories/usuario-repository"
import { assinarSessao, COOKIE } from "@/lib/session"
import type { Perfil } from "@/lib/auth"

const schema = z.object({ email: z.email(), senha: z.string().min(1) })

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema)
  if (!parsed.ok) return parsed.response
  try {
    const u = await buscarUsuarioPorEmail(parsed.data.email)
    if (!u || !(await bcrypt.compare(parsed.data.senha, u.senha_hash))) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 })
    }
    const token = await assinarSessao({
      sub: String(u.id), email: u.email, perfil: u.perfil as Perfil, nome: u.nome,
    })
    const res = NextResponse.json({ perfil: u.perfil, nome: u.nome })
    res.cookies.set(COOKIE, token, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60 * 60 * 8,
    })
    return res
  } catch (e) {
    return handleApiError(e, "Falha no login.")
  }
}

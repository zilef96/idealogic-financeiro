import { SignJWT, jwtVerify } from "jose"
import type { Perfil } from "@/lib/auth"

export const COOKIE = "df_session"
export interface Sessao { sub: string; email: string; perfil: Perfil; nome: string }

function segredo() {
  const s = process.env.AUTH_SECRET
  if (!s || s.length < 32) throw new Error("AUTH_SECRET ausente ou curto (≥32).")
  return new TextEncoder().encode(s)
}

export async function assinarSessao(s: Sessao): Promise<string> {
  return new SignJWT({ email: s.email, perfil: s.perfil, nome: s.nome })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.sub)
    .setExpirationTime("8h")
    .sign(segredo())
}

export async function verificarSessao(token: string): Promise<Sessao | null> {
  try {
    const { payload } = await jwtVerify(token, segredo())
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      perfil: payload.perfil as Perfil,
      nome: String(payload.nome),
    }
  } catch {
    return null
  }
}

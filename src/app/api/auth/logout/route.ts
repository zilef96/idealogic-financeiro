import { NextResponse } from "next/server"
import { criarSupabaseServer } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await criarSupabaseServer()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}

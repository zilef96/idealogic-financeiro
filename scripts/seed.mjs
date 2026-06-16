import { readFileSync } from "node:fs"
import { execFileSync } from "node:child_process"

// carrega .env.local > .env manualmente (Node não injeta dotenv aqui)
for (const f of [".env.local", ".env"]) {
  try {
    for (const linha of readFileSync(f, "utf8").split("\n")) {
      const m = linha.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
    }
  } catch {}
}
const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL ausente")
execFileSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-f", "prisma/seed.sql"], { stdio: "inherit" })
// orçado mensal por item (importado da planilha) — depende do seed principal
execFileSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-f", "prisma/seed-orcado-mensal.sql"], { stdio: "inherit" })
console.log("Seed aplicado (incl. orçado mensal).")

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Servido sob hub.idealogic.com.br/financeiro (rewrite no central-idealogic) —
  // precisa saber o prefixo pra resolver rotas, redirects e assets internos certo.
  basePath: "/financeiro",
};

export default nextConfig;

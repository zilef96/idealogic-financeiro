// fetch() do browser não aplica o basePath do next.config.ts sozinho (só
// next/link e o router fazem isso) — toda chamada de API do lado cliente
// precisa desse prefixo manual, senão a requisição sai da raiz do domínio
// (fora do proxy do hub) em vez de /financeiro/api/...
export const API_BASE = "/financeiro/api"

/**
 * Marca da Idealogic — ícone oficial (`public/icon.png`, 838×523, não é
 * quadrado). `size` define a altura; a largura acompanha a proporção real
 * da imagem, nunca forçada.
 *
 * `<img>` simples com o caminho já incluindo o basePath ("/financeiro") —
 * `next/image` não resolve o asset certo aqui porque seu otimizador não
 * repropaga o basePath pro `src` de imagens locais.
 */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/financeiro/icon.png"
      alt="Idealogic"
      style={{ height: size, width: "auto" }}
      className={className}
    />
  )
}

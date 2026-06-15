export type Perfil = "socio" | "admin"

export function podeAcessar(perfil: Perfil, permitidos: Perfil[]): boolean {
  return permitidos.includes(perfil)
}

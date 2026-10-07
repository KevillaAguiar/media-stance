import type { ReactNode } from "react";
import type { Classe } from "../../api";
import estilos from "./Badge.module.css";

/** Marcadores que não são classe do codebook, mas usam o mesmo formato. */
export type Marcador = "urgente";

export type TomDoBadge = Classe | Marcador;

export interface BadgeProps {
  tom: TomDoBadge;
  children: ReactNode;
}

export const ROTULOS: Record<Classe, string> = {
  a_favor: "A favor",
  contra: "Contra",
  pedido: "Pedido",
  neutro: "Neutro",
  engajamento_afetivo: "Engajamento afetivo",
};

/**
 * Rótulo de classe de posicionamento.
 *
 * Cada tom usa o par bg + fg dos tokens daquela classe. Os pares foram
 * calculados juntos para passar em WCAG AA nos dois modos — misturar o
 * fundo de um com o texto de outro quebra isso em silêncio.
 *
 * O texto dentro do badge não é decorativo: é ele que carrega o
 * significado para quem não distingue as cores.
 */
export function Badge({ tom, children }: BadgeProps) {
  return <span className={`${estilos.badge} ${estilos[tom]}`}>{children}</span>;
}

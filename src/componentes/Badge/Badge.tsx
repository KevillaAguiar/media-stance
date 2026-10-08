import type { ReactNode } from "react";
import type { Classe } from "../../api";
import estilos from "./Badge.module.css";

/** Marcadores que não são classe do codebook, mas usam o mesmo formato. */
export type Marcador = "urgente";

export type TomDoBadge = Classe | Marcador;

export interface BadgeProps {
  tom: TomDoBadge;
  /**
   * `sobreFaixa` para quando o badge estiver dentro de um bloco que já usa
   * a cor da classe — a faixa de urgência do resumo do dia. Aí o fundo do
   * badge vem da superfície de cartão, porque o contraste a vencer é
   * contra a faixa, não contra a página.
   */
  variante?: "solido" | "sobreFaixa";
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
export function Badge({ tom, variante = "solido", children }: BadgeProps) {
  return (
    <span
      className={[
        estilos.badge,
        estilos[tom],
        variante === "sobreFaixa" && estilos.sobreFaixa,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

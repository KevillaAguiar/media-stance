import type { ElementType, ReactNode } from "react";
import estilos from "./Cartao.module.css";

export interface CartaoProps {
  children: ReactNode;
  /** "sutil" para blocos de apoio, como as notas de rodapé. */
  variante?: "padrao" | "sutil";
  /** Troca a tag raiz quando o cartão for uma seção com significado. */
  as?: ElementType;
  className?: string;
}

/** Superfície elevada padrão: fundo de cartão, borda e raio dos tokens. */
export function Cartao({
  children,
  variante = "padrao",
  as: Tag = "div",
  className,
}: CartaoProps) {
  return (
    <Tag
      className={[estilos.cartao, estilos[variante], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}

import estilos from "./ChipTema.module.css";

export interface ChipTemaProps {
  children: string;
}

/**
 * Rótulo do tema da demanda.
 *
 * Neutro de propósito: a cor nesta tela pertence à classe de
 * posicionamento. Se o tema também tivesse cor, as duas competiriam e o
 * que carrega significado — a classe — perderia destaque.
 */
export function ChipTema({ children }: ChipTemaProps) {
  return <span className={estilos.chip}>{children}</span>;
}

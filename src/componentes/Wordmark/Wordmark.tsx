import estilos from "./Wordmark.module.css";

export interface WordmarkProps {
  /** "claro" para o painel escuro; "auto" segue o tema da página. */
  tom?: "auto" | "claro";
}

/**
 * Marca do produto.
 *
 * As duas palavras ficam em um único elemento com um `<span>` dentro, e
 * não em dois blocos: para quem usa leitor de tela, "Media Stance" é um
 * nome só.
 */
export function Wordmark({ tom = "auto" }: WordmarkProps) {
  return (
    <p className={estilos.wordmark} data-tom={tom}>
      MEDIA <span className={estilos.acento}>STANCE</span>
    </p>
  );
}

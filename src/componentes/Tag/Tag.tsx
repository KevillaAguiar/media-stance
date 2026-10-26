import { Icone } from "../Icone/Icone";
import estilos from "./Tag.module.css";

export type TomDaTag = "aliado" | "adversario" | "neutro";

export interface TagProps {
  texto: string;
  tom?: TomDaTag;
  /** Quando ausente, a tag é só leitura e não mostra o botão de remover. */
  aoRemover?: () => void;
}

/**
 * Item de uma lista editável de termos.
 *
 * Não reaproveita `ChipTema` de propósito: lá o chip é rótulo de leitura,
 * aqui é um item que se apaga. Um componente com e sem botão de remover
 * acabaria com duas aparências e um `if` no meio.
 */
export function Tag({ texto, tom = "neutro", aoRemover }: TagProps) {
  return (
    <span className={`${estilos.tag} ${estilos[tom]}`}>
      {texto}
      {aoRemover && (
        <button
          type="button"
          className={estilos.remover}
          onClick={aoRemover}
          /* O nome do termo entra no rótulo: numa lista de doze tags,
             doze botões "Remover" não dizem nada a quem usa leitor de
             tela. */
          aria-label={`Remover ${texto}`}
        >
          <Icone nome="close" tamanho={14} />
        </button>
      )}
    </span>
  );
}

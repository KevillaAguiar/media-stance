import { Cartao } from "../Cartao/Cartao";
import { Icone } from "../Icone/Icone";
import estilos from "./EstadoVazio.module.css";

export interface EstadoVazioProps {
  titulo: string;
  /** Uma frase dizendo o que aconteceu ou o que fazer. */
  descricao: string;
}

/**
 * Tela sem conteúdo.
 *
 * Sempre `all_inbox`, em todas as telas: o ícone aqui não identifica a
 * tela, diz "não há nada". Variar o ícone faria parecer que o estado é
 * diferente em cada lugar quando é o mesmo.
 */
export function EstadoVazio({ titulo, descricao }: EstadoVazioProps) {
  return (
    <Cartao as="section" className={estilos.vazio}>
      <span className={estilos.circulo} aria-hidden="true">
        <Icone nome="all_inbox" tamanho={28} />
      </span>
      <h2 className={estilos.titulo}>{titulo}</h2>
      <p className={estilos.descricao}>{descricao}</p>
    </Cartao>
  );
}

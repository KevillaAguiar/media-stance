import { Badge, ROTULOS } from "../Badge/Badge";
import { Cartao } from "../Cartao/Cartao";
import type { ContagemPorClasse } from "../../api";
import estilos from "./CartaoEstatistica.module.css";

export interface CartaoEstatisticaProps {
  contagem: ContagemPorClasse;
}

const porcentagem = new Intl.NumberFormat("pt-BR", { style: "percent" });
const inteiro = new Intl.NumberFormat("pt-BR");

/** Um cartão do resumo: classe, quantidade e proporção. */
export function CartaoEstatistica({ contagem }: CartaoEstatisticaProps) {
  const { classe, quantidade, proporcao } = contagem;

  return (
    <Cartao as="li" className={estilos.cartao}>
      <Badge tom={classe}>{ROTULOS[classe]}</Badge>

      <p className={estilos.numeros}>
        <span className={estilos.quantidade}>{inteiro.format(quantidade)}</span>
        <span className={estilos.proporcao}>{porcentagem.format(proporcao)}</span>
      </p>

      <p className={estilos.legenda}>comentários classificados</p>
    </Cartao>
  );
}

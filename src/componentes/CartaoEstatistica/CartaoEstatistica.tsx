import { Badge, ROTULOS } from "../Badge/Badge";
import { Cartao } from "../Cartao/Cartao";
import type { ContagemPorClasse } from "../../api";
import estilos from "./CartaoEstatistica.module.css";

export interface CartaoEstatisticaProps {
  contagem: ContagemPorClasse;
}

const porcentagem = new Intl.NumberFormat("pt-BR", { style: "percent" });
const inteiro = new Intl.NumberFormat("pt-BR");

/**
 * Escreve a proporção sem contradizer a contagem ao lado dela.
 *
 * "0%" ao lado de "2" é uma contradição na mesma linha, e "100%" quando
 * sobrou alguma coisa de fora é outra. O arredondamento do formatador
 * produz as duas, então as duas pontas viram texto próprio.
 */
export function escreverProporcao(proporcao: number): string {
  if (!Number.isFinite(proporcao)) return "—";
  if (proporcao > 0 && proporcao < 0.005) return "<1%";
  if (proporcao < 1 && proporcao >= 0.995) return ">99%";
  return porcentagem.format(proporcao);
}

/** Um cartão do resumo: classe, quantidade e proporção. */
export function CartaoEstatistica({ contagem }: CartaoEstatisticaProps) {
  const { classe, quantidade, proporcao } = contagem;

  return (
    <Cartao as="li" className={estilos.cartao}>
      <Badge tom={classe}>{ROTULOS[classe]}</Badge>

      <p className={estilos.numeros}>
        <span className={estilos.quantidade}>{inteiro.format(quantidade)}</span>
        <span className={estilos.proporcao}>
          {escreverProporcao(proporcao)}
        </span>
      </p>

      <p className={estilos.legenda}>comentários classificados</p>
    </Cartao>
  );
}

import { Cartao } from "../Cartao/Cartao";
import type { ContagemDeDemanda } from "../../api";
import estilos from "./ListaDeContagens.module.css";

const inteiro = new Intl.NumberFormat("pt-BR");

export interface ListaDeContagensProps {
  titulo: string;
  itens: ContagemDeDemanda[];
  /** Rótulo em foco, destacado na lista. */
  selecionado: string | null;
  aoEscolher: (rotulo: string | null) => void;
  /** Completa o rótulo acessível: "Água e saneamento, 14 demandas". */
  unidade: string;
}

/**
 * Ranking clicável.
 *
 * Cada linha é um botão, não um texto: o ranking existe para levar à
 * lista daquele recorte. Um ranking que só informa obriga a pessoa a
 * refazer o filtro à mão logo abaixo.
 */
export function ListaDeContagens({
  titulo,
  itens,
  selecionado,
  aoEscolher,
  unidade,
}: ListaDeContagensProps) {
  return (
    <Cartao as="section" className={estilos.cartao}>
      <h2 className={estilos.titulo}>{titulo}</h2>

      {itens.length === 0 ? (
        <p className={estilos.vazio}>Nada no período escolhido.</p>
      ) : (
        <ul className={estilos.lista}>
          {itens.map(({ rotulo, quantidade }) => {
            const ativo = rotulo === selecionado;
            return (
              <li key={rotulo}>
                <button
                  type="button"
                  className={`${estilos.linha} ${ativo ? estilos.ativo : ""}`}
                  aria-pressed={ativo}
                  // Clicar no que já está em foco desfaz o filtro, em vez
                  // de não fazer nada.
                  onClick={() => aoEscolher(ativo ? null : rotulo)}
                >
                  <span className={estilos.rotulo}>{rotulo}</span>
                  <span className={estilos.contagem}>
                    {inteiro.format(quantidade)}
                    <span className="apenas-leitor-de-tela"> {unidade}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Cartao>
  );
}

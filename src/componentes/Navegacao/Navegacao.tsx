import { NavLink } from "react-router-dom";
import { Icone, type NomeDeIcone } from "../Icone/Icone";
import { AlternarTema } from "../AlternarTema/AlternarTema";
import type { Conta } from "../../api";
import estilos from "./Navegacao.module.css";

interface ItemDeNavegacao {
  para: string;
  rotulo: string;
  icone: NomeDeIcone;
}

const ITENS: ItemDeNavegacao[] = [
  { para: "/", rotulo: "Resumo do dia", icone: "bar_chart" },
  { para: "/comentarios", rotulo: "Comentários", icone: "forum" },
  { para: "/demandas", rotulo: "Demandas", icone: "assignment" },
  { para: "/perfil", rotulo: "Perfil", icone: "account_circle" },
];

export interface NavegacaoProps {
  conta: Conta | null;
}

/**
 * Uma única navegação para os três tamanhos de tela:
 *
 *   desktop  sidebar de 240px, ícone + rótulo
 *   tablet   rail de 88px, ícone em círculo, rótulo escondido
 *   mobile   barra inferior fixa, ícone em círculo + rótulo curto
 *
 * O que muda é só CSS. A ordem no DOM é a mesma nos três, o que mantém a
 * navegação por teclado previsível.
 */
export function Navegacao({ conta }: NavegacaoProps) {
  return (
    <nav className={estilos.navegacao} aria-label="Navegação principal">
      <div className={estilos.marca}>
        <p className={estilos.nome}>{conta?.nome ?? "Media Stance"}</p>
        {conta && <p className={estilos.usuario}>{conta.usuario}</p>}
      </div>

      <ul className={estilos.itens}>
        {ITENS.map((item) => (
          <li key={item.para}>
            <NavLink
              to={item.para}
              end={item.para === "/"}
              className={({ isActive }) =>
                `${estilos.item} ${isActive ? estilos.ativo : ""}`
              }
            >
              <span className={estilos.circulo}>
                <Icone nome={item.icone} tamanho={20} />
              </span>
              <span className={estilos.rotulo}>{item.rotulo}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className={estilos.rodape}>
        <AlternarTema />
      </div>
    </nav>
  );
}

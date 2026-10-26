import { useNavigate } from "react-router-dom";
import { Botao } from "../Botao/Botao";
import { Icone } from "../Icone/Icone";
import estilos from "./SemPermissao.module.css";

export interface SemPermissaoProps {
  /** O que a pessoa tentou abrir, para a mensagem não ser genérica. */
  area?: string;
}

/**
 * Mostrada quando um assessor abre uma rota de administração.
 *
 * Não redireciona para o início: quem é mandado de volta sem explicação
 * acha que clicou errado e tenta de novo. Dizer que a área existe, que é
 * restrita e a quem pedir resolve numa leitura.
 *
 * Isto é cortesia de interface, não proteção. Quem digitar a URL da API
 * nem passa por aqui — é o servidor que recusa, com 403.
 */
export function SemPermissao({ area = "esta área" }: SemPermissaoProps) {
  const navegar = useNavigate();

  return (
    <div className={estilos.pagina}>
      <span className={estilos.icone} aria-hidden="true">
        <Icone nome="lock" tamanho={28} />
      </span>

      <h1 className={estilos.titulo}>Acesso restrito</h1>

      <p className={estilos.texto}>
        {area} é do administrador do cliente. Seu acesso é de assessor, que
        cobre o resumo do dia, os comentários e o painel de demandas.
      </p>

      <p className={estilos.texto}>
        Se você precisa alterar isto, peça ao administrador da sua conta.
      </p>

      <Botao onClick={() => navegar("/")}>Voltar ao resumo do dia</Botao>
    </div>
  );
}

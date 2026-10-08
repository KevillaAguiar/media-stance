import { Badge, ROTULOS } from "../Badge/Badge";
import { Cartao } from "../Cartao/Cartao";
import { ChipTema } from "../ChipTema/ChipTema";
import { Icone } from "../Icone/Icone";
import type { Comentario } from "../../api";
import estilos from "./ItemComentario.module.css";

const hora = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

export interface ItemComentarioProps {
  comentario: Comentario;
  aoAbrir: (comentario: Comentario) => void;
}

export function ItemComentario({ comentario, aoAbrir }: ItemComentarioProps) {
  const { texto, classe, urgente, tema, publicadoEm } = comentario;

  return (
    <Cartao as="li" className={estilos.item}>
      <div className={estilos.marcadores}>
        <Badge tom={classe}>{ROTULOS[classe]}</Badge>
        {urgente && <Badge tom="urgente">Urgente</Badge>}
      </div>

      <div className={estilos.corpo}>
        <p className={estilos.texto}>{texto}</p>
        {tema && <ChipTema>{tema}</ChipTema>}
        <p className={estilos.hora}>
          <time dateTime={publicadoEm}>
            {hora.format(new Date(publicadoEm))}
          </time>
        </p>
      </div>

      <button type="button" className={estilos.ver} onClick={() => aoAbrir(comentario)}>
        Ver comentário
        {/* O rótulo nomeia a ação, mas não diz QUAL comentário. Numa lista
            de cinco botões idênticos, quem navega por leitor de tela fica
            sem saber onde está — daí o complemento escondido. */}
        <span className="apenas-leitor-de-tela">: {texto}</span>
        <Icone nome="arrow_right_alt" tamanho={20} />
      </button>
    </Cartao>
  );
}

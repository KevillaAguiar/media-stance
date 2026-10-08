import { useEffect, useId, useRef } from "react";
import { Badge, ROTULOS } from "../Badge/Badge";
import { Botao } from "../Botao/Botao";
import { ChipTema } from "../ChipTema/ChipTema";
import { Icone } from "../Icone/Icone";
import type { Comentario } from "../../api";
import estilos from "./ModalComentario.module.css";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export interface ModalComentarioProps {
  comentario: Comentario | null;
  aoFechar: () => void;
}

/**
 * Detalhes do comentário.
 *
 * Usa o `<dialog>` nativo com `showModal()`, que já traz prender o foco
 * dentro da caixa, fechar no Escape, devolver o foco a quem abriu e
 * tornar o resto da página inerte. Reconstruir isso à mão é onde modais
 * costumam ficar inacessíveis.
 */
export function ModalComentario({ comentario, aoFechar }: ModalComentarioProps) {
  const caixa = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const elemento = caixa.current;
    if (!elemento) return;

    if (comentario && !elemento.open) elemento.showModal();
    else if (!comentario && elemento.open) elemento.close();
  }, [comentario]);

  if (!comentario) {
    return <dialog ref={caixa} className={estilos.caixa} aria-labelledby={idTitulo} />;
  }

  const { texto, classe, urgente, tema, publicadoEm, urlNaRede } = comentario;

  return (
    <dialog
      ref={caixa}
      className={estilos.caixa}
      aria-labelledby={idTitulo}
      // Dispara tanto no Escape quanto no clique do botão de fechar, então
      // o estado da página acompanha os dois caminhos.
      onClose={aoFechar}
      onClick={(evento) => {
        // Clique no backdrop: o alvo é o próprio <dialog>, nunca o conteúdo.
        if (evento.target === caixa.current) caixa.current?.close();
      }}
    >
      <div className={estilos.conteudo}>
        <header className={estilos.cabecalho}>
          <h2 id={idTitulo} className={estilos.titulo}>
            Detalhes do comentário
          </h2>
          <button
            type="button"
            className={estilos.fechar}
            onClick={() => caixa.current?.close()}
            aria-label="Fechar"
          >
            <Icone nome="close" tamanho={24} />
          </button>
        </header>

        <div className={estilos.marcadores}>
          <Badge tom={classe}>{ROTULOS[classe]}</Badge>
          {urgente && <Badge tom="urgente">Urgente</Badge>}
          {tema && <ChipTema>{tema}</ChipTema>}
        </div>

        <blockquote className={estilos.citacao}>{texto}</blockquote>

        <p className={estilos.publicacao}>
          Publicado em{" "}
          <time dateTime={publicadoEm}>
            {dataHora.format(new Date(publicadoEm))}
          </time>
        </p>

        <hr className={estilos.divisor} />

        <p className={estilos.explicacao}>
          Use o botão abaixo para responder diretamente no Instagram.
        </p>

        {/* Responder acontece na rede social, não aqui — está fora do MVP.
            Por isso é um link, e não um formulário. */}
        <Botao largo href={urlNaRede} target="_blank" rel="noopener noreferrer">
          Responder comentário
          <Icone nome="arrow_right_alt" tamanho={20} />
          <span className="apenas-leitor-de-tela">(abre o Instagram)</span>
        </Botao>
      </div>
    </dialog>
  );
}

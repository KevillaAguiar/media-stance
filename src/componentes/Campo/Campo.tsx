import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { Icone, type NomeDeIcone } from "../Icone/Icone";
import estilos from "./Campo.module.css";

export interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  icone?: NomeDeIcone;
  /** Mensagem de erro; quando presente, o campo é marcado como inválido. */
  erro?: string;
  /** Texto de apoio abaixo do campo, como regra de senha. */
  ajuda?: string;
  /** Botão à direita dentro da caixa, como mostrar/ocultar senha. */
  acaoFinal?: ReactNode;
}

/**
 * Campo de formulário com rótulo.
 *
 * O rótulo é um `<label>` ligado ao campo, nunca um texto solto acima:
 * só assim clicar nele foca o campo e o leitor de tela anuncia os dois
 * juntos. Erro e ajuda entram por `aria-describedby` pelo mesmo motivo.
 */
export function Campo({
  rotulo,
  icone,
  erro,
  ajuda,
  acaoFinal,
  className,
  ...resto
}: CampoProps) {
  const id = useId();
  const idErro = `${id}-erro`;
  const idAjuda = `${id}-ajuda`;

  const descritores = [erro && idErro, ajuda && idAjuda].filter(Boolean).join(" ");

  return (
    <div className={[estilos.campo, className].filter(Boolean).join(" ")}>
      <label className={estilos.rotulo} htmlFor={id}>
        {rotulo}
      </label>

      <div className={`${estilos.caixa} ${erro ? estilos.invalida : ""}`}>
        {icone && <Icone nome={icone} tamanho={20} className={estilos.icone} />}
        <input
          id={id}
          className={estilos.entrada}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descritores || undefined}
          {...resto}
        />
        {acaoFinal}
      </div>

      {ajuda && (
        <p id={idAjuda} className={estilos.ajuda}>
          {ajuda}
        </p>
      )}

      {erro && (
        <p id={idErro} className={estilos.erro}>
          {erro}
        </p>
      )}
    </div>
  );
}

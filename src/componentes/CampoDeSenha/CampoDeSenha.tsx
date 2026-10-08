import { useState } from "react";
import { Campo, type CampoProps } from "../Campo/Campo";
import { Icone } from "../Icone/Icone";
import estilos from "./CampoDeSenha.module.css";

export type CampoDeSenhaProps = Omit<CampoProps, "type" | "icone" | "acaoFinal">;

/**
 * Campo de senha com mostrar/ocultar.
 *
 * Existe porque digitar senha às cegas é a principal causa de erro de
 * digitação em formulário de cadastro — e porque sem isso a pessoa tende
 * a escolher uma senha mais curta para não errar.
 */
export function CampoDeSenha(props: CampoDeSenhaProps) {
  const [visivel, setVisivel] = useState(false);

  return (
    <Campo
      {...props}
      type={visivel ? "text" : "password"}
      icone="lock"
      acaoFinal={
        <button
          type="button"
          className={estilos.olho}
          onClick={() => setVisivel((v) => !v)}
          // O rótulo diz a AÇÃO, não o estado: "Mostrar senha" é o que
          // acontece ao acionar. `aria-pressed` conta o estado.
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visivel}
        >
          <Icone nome={visivel ? "visibility_off" : "visibility"} tamanho={20} />
        </button>
      }
    />
  );
}

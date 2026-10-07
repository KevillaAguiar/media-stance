import { Icone } from "../Icone/Icone";
import { useTema } from "../../tema/useTema";
import estilos from "./AlternarTema.module.css";

/**
 * Interruptor de tema da navegação.
 *
 * É um `role="switch"` de verdade, não um botão com aparência de switch:
 * o leitor de tela precisa anunciar o estado ligado/desligado, e não só
 * o rótulo.
 */
export function AlternarTema() {
  const { tema, alternar } = useTema();
  const escuro = tema === "escuro";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={escuro}
      onClick={alternar}
      className={estilos.alternar}
    >
      <Icone nome="brightness_6" tamanho={20} className={estilos.icone} />
      <span className={estilos.rotulo}>Modo escuro</span>
      <span className={estilos.trilho} data-ligado={escuro}>
        <span className={estilos.botao} />
      </span>
    </button>
  );
}

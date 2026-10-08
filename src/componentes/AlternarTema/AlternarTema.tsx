import { Icone } from "../Icone/Icone";
import { useTema } from "../../tema/useTema";
import estilos from "./AlternarTema.module.css";

export interface AlternarTemaProps {
  /**
   * Onde o interruptor está. No rail do tablet a navegação encolhe para
   * ícones, mas o mesmo componente dentro de uma página não deve encolher
   * junto — por isso o contexto é declarado, e não deduzido da largura da
   * janela.
   */
  contexto?: "nav" | "pagina";
}

/**
 * Interruptor de tema.
 *
 * É um `role="switch"` de verdade, não um botão com aparência de switch:
 * o leitor de tela precisa anunciar o estado ligado/desligado, e não só
 * o rótulo.
 */
export function AlternarTema({ contexto = "nav" }: AlternarTemaProps) {
  const { tema, alternar } = useTema();
  const escuro = tema === "escuro";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={escuro}
      onClick={alternar}
      data-contexto={contexto}
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

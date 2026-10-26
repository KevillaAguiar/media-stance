import type { ReactNode } from "react";
import { Navegacao } from "../Navegacao/Navegacao";
import type { Conta, PapelDoUsuario } from "../../api";
import estilos from "./Layout.module.css";

export interface LayoutProps {
  conta: Conta | null;
  /** `null` enquanto o perfil não chegou. */
  papel?: PapelDoUsuario | null;
  children: ReactNode;
}

/** Casca das telas internas: navegação fixa + área de conteúdo. */
export function Layout({ conta, papel = null, children }: LayoutProps) {
  return (
    <div className={estilos.layout}>
      {/* Primeiro elemento focável da página: deixa quem usa teclado pular
          os quatro itens de navegação em toda troca de tela. */}
      <a href="#conteudo" className={estilos.pular}>
        Pular para o conteúdo
      </a>
      <Navegacao conta={conta} papel={papel} />
      <main id="conteudo" className={estilos.conteudo} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

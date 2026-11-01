import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Navegacao } from "../Navegacao/Navegacao";
import { SeletorDeConta } from "../SeletorDeConta/SeletorDeConta";
import type { Conta, ContaEmFoco, PapelDoUsuario } from "../../api";
import estilos from "./Layout.module.css";

export interface LayoutProps {
  conta: Conta | null;
  /** `null` enquanto o perfil não chegou. */
  papel?: PapelDoUsuario | null;
  foco?: ContaEmFoco | null;
  aoTrocarConta?: (conta: ContaEmFoco) => void;
  children: ReactNode;
}

/** Casca das telas internas: navegação fixa + área de conteúdo. */
export function Layout({ conta, papel = null, foco = null, aoTrocarConta, children }: LayoutProps) {
  const conteudo = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // Quem rola agora é o <main>, e ele é o mesmo elemento em todas as
  // telas: sem isto, sair do fim da lista de comentários e abrir demandas
  // deixaria a pessoa no meio da tela nova, sem ter rolado nada.
  useEffect(() => {
    // `scrollTop` e não `scrollTo`: faz o mesmo, e existe tanto no
    // navegador quanto no jsdom, onde os testes rodam.
    if (conteudo.current) conteudo.current.scrollTop = 0;
  }, [pathname]);

  return (
    <div className={estilos.layout}>
      {/* Primeiro elemento focável da página: deixa quem usa teclado pular
          os quatro itens de navegação em toda troca de tela. */}
      <a href="#conteudo" className={estilos.pular}>
        Pular para o conteúdo
      </a>
      <Navegacao conta={conta} papel={papel} foco={foco} aoTrocarConta={aoTrocarConta} />
      <main id="conteudo" ref={conteudo} className={estilos.conteudo} tabIndex={-1}>
        {/* No celular a navegação é a barra de baixo, que já tem quatro
            alvos em 375px. O seletor não cabe lá, então vira uma faixa no
            topo do conteúdo — escondida nos outros tamanhos, onde ele já
            mora na barra lateral. */}
        {foco && aoTrocarConta && (
          <div className={estilos.faixaDeConta}>
            <SeletorDeConta foco={foco} aoTrocar={aoTrocarConta} contexto="faixa" />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

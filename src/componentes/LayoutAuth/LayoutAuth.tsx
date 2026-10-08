import type { ReactNode } from "react";
import { Wordmark } from "../Wordmark/Wordmark";
import estilos from "./LayoutAuth.module.css";

const DESTAQUES = [
  { valor: "58%", rotulo: "A favor", classe: "favor" },
  { valor: "2%", rotulo: "Contra", classe: "contra" },
  { valor: "10%", rotulo: "Pedido", classe: "pedido" },
] as const;

/** O painel escuro de apresentação, só nas telas de entrada e cadastro. */
function PainelDeMarca() {
  return (
    // `aria-hidden` porque é material de apresentação: quem usa leitor de
    // tela quer chegar ao formulário, não ouvir a chamada do produto antes.
    <aside className={estilos.marca} aria-hidden="true">
      <Wordmark tom="claro" />

      <div>
        <h2 className={estilos.chamada}>
          Menos <em className={estilos.enfase}>sentimento</em>.
          <br />
          Mais posicionamento.
        </h2>
        <p className={estilos.subchamada}>
          Separe quem está a favor, contra ou só pedindo algo — e responda
          primeiro o que realmente exige atenção.
        </p>
      </div>

      <div>
        <p className={estilos.rotuloResumo}>Resumo de hoje</p>
        <ul className={estilos.chips}>
          {DESTAQUES.map(({ valor, rotulo, classe }) => (
            <li key={rotulo} className={`${estilos.chip} ${estilos[classe]}`}>
              <span className={estilos.chipValor}>{valor}</span>
              <span className={estilos.chipRotulo}>{rotulo}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export interface LayoutAuthProps {
  /**
   * "apresentacao" abre com o painel de marca, para entrar e criar conta.
   * "foco" é o cartão sozinho, para recuperar senha — quem chega ali já
   * conhece o produto e está no meio de uma tarefa.
   */
  variante?: "apresentacao" | "foco";
  /**
   * "escuro" fixa o tema escuro nesta tela, independente da preferência.
   * Vale para todo o conjunto público: entrar, criar conta e recuperar
   * senha são passos de um fluxo só, e alternar claro/escuro no meio dele
   * parece troca de produto. Dentro do produto quem manda é a escolha da
   * pessoa.
   */
  tema?: "auto" | "escuro";
  children: ReactNode;
}

export function LayoutAuth({
  variante = "apresentacao",
  tema = "auto",
  children,
}: LayoutAuthProps) {
  return (
    // O atributo redefine os tokens só para esta subárvore — os mesmos
    // valores do modo escuro, sem uma segunda cópia deles.
    <div className={estilos.pagina} data-tema={tema === "escuro" ? "escuro" : undefined}>
      <main className={`${estilos.cartao} ${estilos[variante]}`}>
        {variante === "apresentacao" && <PainelDeMarca />}
        <div className={estilos.conteudo}>
          {variante === "foco" && (
            <div className={estilos.marcaCentral}>
              <Wordmark />
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

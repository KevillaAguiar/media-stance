import { useCallback, useEffect, useState } from "react";

export type Tema = "claro" | "escuro";
/** `null` = segue a preferência do sistema. */
export type TemaEscolhido = Tema | null;

const CHAVE = "media-stance:tema";

function lerEscolha(): TemaEscolhido {
  const guardado = localStorage.getItem(CHAVE);
  return guardado === "claro" || guardado === "escuro" ? guardado : null;
}

function temaDoSistema(): Tema {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "escuro"
    : "claro";
}

/**
 * Controla o atributo `data-tema` na raiz, que é o que o tokens.css lê.
 * Sem atributo, o CSS segue `prefers-color-scheme` sozinho.
 */
export function useTema() {
  const [escolha, setEscolha] = useState<TemaEscolhido>(lerEscolha);
  const [doSistema, setDoSistema] = useState<Tema>(temaDoSistema);

  // Acompanha a troca de tema no sistema operacional enquanto o usuário
  // não tiver feito uma escolha própria.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const aoMudar = () => setDoSistema(mq.matches ? "escuro" : "claro");
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, []);

  const tema: Tema = escolha ?? doSistema;

  useEffect(() => {
    const raiz = document.documentElement;
    if (escolha === null) raiz.removeAttribute("data-tema");
    else raiz.setAttribute("data-tema", escolha);
  }, [escolha]);

  const definir = useCallback((novo: TemaEscolhido) => {
    setEscolha(novo);
    if (novo === null) localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, novo);
  }, []);

  const alternar = useCallback(() => {
    definir(tema === "escuro" ? "claro" : "escuro");
  }, [tema, definir]);

  return { tema, escolha, definir, alternar };
}

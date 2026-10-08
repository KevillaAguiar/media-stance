import { useCallback, useEffect, useState } from "react";

/* Sessão simulada.
   ---------------------------------------------------------------
   ISTO NÃO É AUTENTICAÇÃO. É um sinalizador no navegador que diz se o
   fluxo de entrada já foi percorrido, para que as telas públicas e as
   internas possam ser demonstradas em sequência enquanto não há
   back-end.

   Quem autentica de verdade é o servidor, e quem guarda a sessão é um
   cookie `HttpOnly` que o JavaScript não lê. Ao ligar a API real, este
   arquivo inteiro sai: as telas passam a perguntar ao servidor quem
   está em sessão, e proteger rota no front vira conveniência de
   navegação, nunca barreira de segurança.
   --------------------------------------------------------------- */

const CHAVE = "media-stance:sessao-simulada";

// Um evento próprio porque `storage` só dispara em OUTRAS abas: sem ele,
// entrar ou sair não atualizaria a aba onde a ação aconteceu.
const EVENTO = "media-stance:sessao-mudou";

function avisar() {
  window.dispatchEvent(new Event(EVENTO));
}

export function estaEmSessao(): boolean {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    // Navegação privada ou armazenamento bloqueado.
    return false;
  }
}

export function abrirSessao() {
  try {
    localStorage.setItem(CHAVE, "1");
  } catch {
    /* segue sem persistir */
  }
  avisar();
}

export function encerrarSessao() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* nada a limpar */
  }
  avisar();
}

export function useSessao() {
  const [emSessao, setEmSessao] = useState(estaEmSessao);

  useEffect(() => {
    const atualizar = () => setEmSessao(estaEmSessao());
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(EVENTO, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, []);

  return {
    emSessao,
    entrar: useCallback(abrirSessao, []),
    sair: useCallback(encerrarSessao, []),
  };
}
